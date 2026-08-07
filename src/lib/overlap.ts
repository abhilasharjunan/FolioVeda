import { getFundInsights, FundInsights, FundHoldings } from "@/lib/finapi";

/**
 * Weighted portfolio overlap using MIN-weight method:
 * Overlap% = Σ min(W_A,i, W_B,i) across common stocks.
 *
 * Caveat: insights expose each fund's top disclosed holdings (not full book),
 * so treat results as directional.
 */

export interface CommonStock {
  stockName: string;
  weightA: number;
  weightB: number;
  minWeight: number;
  sector?: string;
}

export interface OverlapResult {
  schemeCodeA: string;
  schemeCodeB: string;
  schemeNameA: string;
  schemeNameB: string;
  overlapPercentage: number;
  commonStocks: CommonStock[];
  commonCount: number;
  dataAvailable: boolean;
}

export interface LookThroughHolding {
  stockName: string;
  sector: string;
  effectiveWeight: number;
  heldInFunds: { schemeCode: string; schemeName: string; weightInFund: number; contribution: number }[];
}

export interface PortfolioFundWeight {
  schemeCode: string;
  schemeName: string;
  portfolioWeight: number; // 0-100 of user portfolio value
}

/** Normalize issuer names so "HDFC Bank Ltd." matches "HDFC Bank". */
export function normalizeStockKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(limited|ltd|llp|plc|inc|corp|corporation|co|company|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function overlapFromInsights(insightsA: FundInsights, insightsB: FundInsights): Omit<OverlapResult, "schemeCodeA" | "schemeCodeB"> {
  const mapB = new Map<string, { allocation: number; stockName: string; sector: string }>();
  for (const h of insightsB.holdings) {
    mapB.set(normalizeStockKey(h.stockName), {
      allocation: h.allocation,
      stockName: h.stockName,
      sector: h.sector,
    });
  }

  const commonStocks: CommonStock[] = [];
  let overlapPercentage = 0;

  for (const stockA of insightsA.holdings) {
    const key = normalizeStockKey(stockA.stockName);
    const match = mapB.get(key);
    if (!match) continue;
    const minWeight = Math.min(stockA.allocation, match.allocation);
    overlapPercentage += minWeight;
    commonStocks.push({
      stockName: stockA.stockName,
      weightA: stockA.allocation,
      weightB: match.allocation,
      minWeight,
      sector: stockA.sector || match.sector,
    });
  }

  commonStocks.sort((a, b) => b.minWeight - a.minWeight);

  return {
    schemeNameA: insightsA.schemeName,
    schemeNameB: insightsB.schemeName,
    overlapPercentage,
    commonStocks,
    commonCount: commonStocks.length,
    dataAvailable: true,
  };
}

export async function calculateFundOverlap(
  schemeCodeA: string,
  schemeCodeB: string
): Promise<OverlapResult | null> {
  if (schemeCodeA === schemeCodeB) return null;

  const [insightsA, insightsB] = await Promise.all([
    getFundInsights(schemeCodeA),
    getFundInsights(schemeCodeB),
  ]);

  if (!insightsA?.holdings.length || !insightsB?.holdings.length) return null;

  return {
    schemeCodeA,
    schemeCodeB,
    ...overlapFromInsights(insightsA, insightsB),
  };
}

/**
 * Portfolio-wide overlap matrix — fetches each fund once (N lookups, not N²).
 */
export async function calculatePortfolioOverlapMatrix(schemeCodes: string[]): Promise<OverlapResult[]> {
  const uniqueCodes = [...new Set(schemeCodes)];
  if (uniqueCodes.length < 2) return [];

  const insightsByCode = new Map(
    await Promise.all(
      uniqueCodes.map(async (code) => [code, await getFundInsights(code)] as const)
    )
  );

  const results: OverlapResult[] = [];

  for (let i = 0; i < uniqueCodes.length; i++) {
    for (let j = i + 1; j < uniqueCodes.length; j++) {
      const codeA = uniqueCodes[i];
      const codeB = uniqueCodes[j];
      const insightsA = insightsByCode.get(codeA) ?? null;
      const insightsB = insightsByCode.get(codeB) ?? null;

      if (!insightsA?.holdings.length || !insightsB?.holdings.length) {
        results.push({
          schemeCodeA: codeA,
          schemeCodeB: codeB,
          schemeNameA: insightsA?.schemeName || `Scheme ${codeA}`,
          schemeNameB: insightsB?.schemeName || `Scheme ${codeB}`,
          overlapPercentage: 0,
          commonStocks: [],
          commonCount: 0,
          dataAvailable: false,
        });
        continue;
      }

      results.push({
        schemeCodeA: codeA,
        schemeCodeB: codeB,
        ...overlapFromInsights(insightsA, insightsB),
      });
    }
  }

  return results;
}

/**
 * Look-through stock concentration across the user's portfolio:
 * EffectiveWeight_i = Σ_f (portfolioWeight_f × stockWeight_i,f / 100)
 */
export function calculateLookThroughHoldings(
  fundWeights: PortfolioFundWeight[],
  insightsByCode: Map<string, FundInsights | null>,
  limit = 15
): LookThroughHolding[] {
  const byStock = new Map<
    string,
    {
      stockName: string;
      sector: string;
      effectiveWeight: number;
      heldInFunds: LookThroughHolding["heldInFunds"];
    }
  >();

  for (const fund of fundWeights) {
    const insights = insightsByCode.get(fund.schemeCode);
    if (!insights?.holdings?.length || fund.portfolioWeight <= 0) continue;

    for (const h of insights.holdings as FundHoldings[]) {
      const key = normalizeStockKey(h.stockName);
      const contribution = (fund.portfolioWeight * h.allocation) / 100;
      const existing = byStock.get(key);
      if (!existing) {
        byStock.set(key, {
          stockName: h.stockName,
          sector: h.sector || "Other",
          effectiveWeight: contribution,
          heldInFunds: [
            {
              schemeCode: fund.schemeCode,
              schemeName: fund.schemeName,
              weightInFund: h.allocation,
              contribution,
            },
          ],
        });
      } else {
        existing.effectiveWeight += contribution;
        existing.heldInFunds.push({
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          weightInFund: h.allocation,
          contribution,
        });
        if (!existing.sector || existing.sector === "Other") {
          existing.sector = h.sector || existing.sector;
        }
      }
    }
  }

  return Array.from(byStock.values())
    .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
    .slice(0, limit)
    .map((s) => ({
      ...s,
      heldInFunds: s.heldInFunds.sort((a, b) => b.contribution - a.contribution),
    }));
}

export async function buildPortfolioOverlapAnalysis(
  fundWeights: PortfolioFundWeight[]
): Promise<{
  pairs: OverlapResult[];
  lookThrough: LookThroughHolding[];
  insightsAvailable: number;
}> {
  const uniqueCodes = [...new Set(fundWeights.map((f) => f.schemeCode))];

  const insightsByCode = new Map(
    await Promise.all(
      uniqueCodes.map(async (code) => [code, await getFundInsights(code)] as const)
    )
  );

  const pairs: OverlapResult[] = [];
  for (let i = 0; i < uniqueCodes.length; i++) {
    for (let j = i + 1; j < uniqueCodes.length; j++) {
      const codeA = uniqueCodes[i];
      const codeB = uniqueCodes[j];
      const insightsA = insightsByCode.get(codeA) ?? null;
      const insightsB = insightsByCode.get(codeB) ?? null;
      if (!insightsA?.holdings.length || !insightsB?.holdings.length) {
        pairs.push({
          schemeCodeA: codeA,
          schemeCodeB: codeB,
          schemeNameA: insightsA?.schemeName || fundWeights.find((f) => f.schemeCode === codeA)?.schemeName || `Scheme ${codeA}`,
          schemeNameB: insightsB?.schemeName || fundWeights.find((f) => f.schemeCode === codeB)?.schemeName || `Scheme ${codeB}`,
          overlapPercentage: 0,
          commonStocks: [],
          commonCount: 0,
          dataAvailable: false,
        });
        continue;
      }
      pairs.push({
        schemeCodeA: codeA,
        schemeCodeB: codeB,
        ...overlapFromInsights(insightsA, insightsB),
      });
    }
  }

  const lookThrough = calculateLookThroughHoldings(fundWeights, insightsByCode);
  const insightsAvailable = [...insightsByCode.values()].filter((v) => (v?.holdings?.length || 0) > 0).length;

  return { pairs, lookThrough, insightsAvailable };
}
