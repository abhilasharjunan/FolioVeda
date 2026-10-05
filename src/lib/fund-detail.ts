import { getFundInsights } from "@/lib/finapi";
import { resolveSectorAllocation, topHoldings } from "@/lib/fund-sectors";
import { computePeriodReturnsFromMfapi } from "@/lib/funds";
import { prisma } from "@/lib/prisma";

/** UTI Nifty 50 Index Fund — Direct Growth (curated benchmark). */
export const NIFTY50_INDEX_SCHEME = "120716";

export const FUND_RETURN_PERIODS = ["1M", "3M", "6M", "1Y", "3Y", "5Y", "10Y"] as const;
export type FundReturnPeriod = (typeof FUND_RETURN_PERIODS)[number];

export type PeriodReturns = Record<string, number | null> & {
  sinceInception?: number | null;
};

export type BenchmarkCompareRow = {
  period: string;
  fund: number | null;
  nifty50: number | null;
  alpha: number | null;
};

export type FundDetailPayload = {
  schemeCode: string;
  schemeName: string;
  category: string | null;
  fundHouse: string;
  latestNav: number | null;
  lastUpdated: string | null;
  riskLevel: string | null;
  riskScore: number | null;
  aum: string;
  expenseRatio: string;
  portfolioTurnover: string;
  fundManager: {
    name: string;
    tenure: string | null;
    experience: string | null;
    history: string | null;
  } | null;
  holdings: Array<{
    stockName: string;
    ticker?: string;
    allocation: number;
    sector: string;
  }>;
  /** Total disclosed holdings before top-N trim (for UI footnote). */
  holdingsCount: number;
  sectorAllocation: Record<string, number>;
  asOfDate: string | null;
  periodReturns: PeriodReturns;
  sinceInception: number | null;
  benchmark: {
    schemeCode: string;
    schemeName: string;
    periodReturns: PeriodReturns;
    sinceInception: number | null;
  };
  comparison: BenchmarkCompareRow[];
};

function mapRiskLevel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    Low: "Low",
    "Low to Moderate": "Low to Moderate",
    Moderate: "Moderate",
    "Moderate to High": "Moderate to High",
    High: "High",
    "Very High": "Very High",
  };
  return map[raw] || raw;
}

function buildComparison(
  fund: PeriodReturns,
  fundSi: number | null,
  nifty: PeriodReturns,
  niftySi: number | null
): BenchmarkCompareRow[] {
  const rows: BenchmarkCompareRow[] = [];
  for (const period of FUND_RETURN_PERIODS) {
    const f = fund[period] ?? null;
    const n = nifty[period] ?? null;
    if (f == null && n == null) continue;
    rows.push({
      period,
      fund: f,
      nifty50: n,
      alpha: f != null && n != null ? Number((f - n).toFixed(2)) : null,
    });
  }
  if (fundSi != null || niftySi != null) {
    rows.push({
      period: "SI",
      fund: fundSi,
      nifty50: niftySi,
      alpha: fundSi != null && niftySi != null ? Number((fundSi - niftySi).toFixed(2)) : null,
    });
  }
  return rows;
}

function cleanText(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t || t === "N/A" || t === "Not Available" || t.toLowerCase() === "unknown") return null;
  return t;
}

export async function getFundDetail(schemeCode: string): Promise<FundDetailPayload | null> {
  const [insights, scheme, fundReturns, niftyReturns] = await Promise.all([
    getFundInsights(schemeCode),
    prisma.schemeMaster.findUnique({ where: { schemeCode } }),
    computePeriodReturnsFromMfapi(schemeCode).catch(() => null),
    computePeriodReturnsFromMfapi(NIFTY50_INDEX_SCHEME).catch(() => null),
  ]);

  if (!insights && !scheme && !fundReturns) return null;

  const managerName = cleanText(scheme?.fundManagerName || insights?.fundManager?.name);
  const managerTenure = cleanText(scheme?.fundManagerTenure || insights?.fundManager?.tenure);
  const managerExperience = cleanText(insights?.fundManager?.experience);
  // No dedicated bio feed yet — surface tenure/experience as brief history when present.
  const managerHistory =
    [managerExperience, managerTenure ? `Managing this scheme for ${managerTenure}.` : null]
      .filter(Boolean)
      .join(" ") || null;

  const fundManager =
    managerName || managerTenure || managerHistory
      ? {
          name: managerName || "Fund manager",
          tenure: managerTenure,
          experience: managerExperience,
          history: managerHistory,
        }
      : null;

  const periodReturns: PeriodReturns = fundReturns?.returns || {};
  const sinceInception = fundReturns?.sinceInception ?? null;
  const niftyPeriod: PeriodReturns = niftyReturns?.returns || {};
  const niftySi = niftyReturns?.sinceInception ?? null;

  const allHoldings = (insights?.holdings || []).filter((h) => h.stockName && h.allocation > 0);
  const holdings = topHoldings(allHoldings);
  const sectorAllocation = resolveSectorAllocation(
    insights?.sectorAllocation || {},
    allHoldings
  );

  return {
    schemeCode: scheme?.schemeCode || schemeCode,
    schemeName: scheme?.schemeName || insights?.schemeName || `Scheme ${schemeCode}`,
    category: scheme?.category || null,
    fundHouse: scheme?.fundHouse || insights?.fundHouse || "N/A",
    latestNav: scheme?.latestNav != null ? Number(scheme.latestNav) : fundReturns?.nav ?? null,
    lastUpdated: scheme?.lastUpdated
      ? new Date(scheme.lastUpdated).toISOString()
      : null,
    riskLevel: mapRiskLevel(scheme?.riskLevel),
    riskScore: scheme?.riskScore != null ? Number(scheme.riskScore) : null,
    aum: insights?.aum || "N/A",
    expenseRatio: insights?.expenseRatio || "N/A",
    portfolioTurnover: insights?.portfolioTurnover || "N/A",
    fundManager,
    holdings,
    holdingsCount: allHoldings.length,
    sectorAllocation,
    asOfDate: insights?.asOfDate || null,
    periodReturns,
    sinceInception,
    benchmark: {
      schemeCode: NIFTY50_INDEX_SCHEME,
      schemeName: "UTI Nifty 50 Index Fund",
      periodReturns: niftyPeriod,
      sinceInception: niftySi,
    },
    comparison: buildComparison(periodReturns, sinceInception, niftyPeriod, niftySi),
  };
}
