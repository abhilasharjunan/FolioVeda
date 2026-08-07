import { fetchSchemeDetails } from "./mfapi";
import { prisma } from "./prisma";
import redis from "./redis";

// Fund holdings/sector composition changes slowly. Redis caches full insights
// (including holdings) for 1h; DB sectorCache only stores sector allocation.
// Important: never short-circuit on sectorCache with empty holdings — that was
// the root cause of Portfolio Overlap showing N/A for every pair.
const REDIS_INSIGHTS_TTL_SECONDS = 6 * 3600; // 6 hours

function getFundManagerFromPeer(peer: any): { name: string; tenure: string; experience: string } | null {
  if (!peer) return null;
  const name = peer.fundManagerName || peer.fund_manager_name || peer.fundManager?.name || null;
  const tenure = peer.fundManagerTenure || peer.fund_manager_tenure || peer.fundManager?.tenure || null;
  const experience = peer.fundManagerExperience || peer.fund_manager_experience || peer.fundManager?.experience || null;
  if (name) return { name, tenure: tenure || 'N/A', experience: experience || 'N/A' };
  return null;
}

export interface FundHoldings {
  stockName: string;
  allocation: number;
  sector: string;
}

export interface FundManager {
  name: string;
  tenure: string;
  experience: string;
}

export interface FundInsights {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  aum: string;
  expenseRatio: string;
  portfolioTurnover: string;
  fundManager: FundManager;
  holdings: FundHoldings[];
  sectorAllocation: Record<string, number>;
  peers: any[];
}

function partialInsights(
  schemeCode: string,
  schemeName: string,
  fundHouse: string,
  fundManager: FundManager,
  holdings: FundHoldings[] = [],
  sectorAllocation: Record<string, number> = {}
): FundInsights {
  return {
    schemeCode,
    schemeName,
    fundHouse,
    aum: "N/A",
    expenseRatio: "N/A",
    portfolioTurnover: "N/A",
    fundManager,
    holdings,
    sectorAllocation,
    peers: [],
  };
}

export async function getFundInsights(schemeCode: string): Promise<FundInsights | null> {
  // v3: never serve empty-holdings blobs that older caches may have written.
  const redisKey = `fundInsights:v3:${schemeCode}`;

  if (redis) {
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const parsed = JSON.parse(cached) as FundInsights;
        if (parsed?.holdings?.length) return parsed;
      }
    } catch (err) {
      console.warn(`Redis read failed for ${redisKey}:`, err);
    }
  }

  const result = await fetchFundInsightsUncached(schemeCode);

  if (redis && result?.holdings?.length) {
    redis.set(redisKey, JSON.stringify(result), 'EX', REDIS_INSIGHTS_TTL_SECONDS).catch(() => {});
  }

  return result;
}

async function fetchFundInsightsUncached(schemeCode: string): Promise<FundInsights | null> {
  try {
    const schemeDetails = await fetchSchemeDetails(schemeCode);
    const schemeName = schemeDetails.meta?.scheme_name || schemeDetails.schemeName || `Scheme ${schemeCode}`;
    const fundHouse = schemeDetails.meta?.fund_house || "N/A";
    const dbScheme = await prisma.schemeMaster.findUnique({
      where: { schemeCode },
      select: { fundManagerName: true, fundManagerTenure: true },
    });
    const fallbackManager: FundManager = {
      name: dbScheme?.fundManagerName || "Not Available",
      tenure: dbScheme?.fundManagerTenure || "N/A",
      experience: "N/A",
    };

    // Sector-only DB cache is fine for allocation charts, but must not replace holdings.
    let cachedSectors: Record<string, number> = {};
    try {
      const sectorRow = await prisma.sectorCache.findUnique({ where: { schemeCode } });
      if (sectorRow?.sectorData && typeof sectorRow.sectorData === 'object') {
        cachedSectors = sectorRow.sectorData as Record<string, number>;
      }
    } catch {
      // ignore cache read errors
    }

    const isin = schemeDetails.meta?.isin_growth;
    if (!isin) {
      console.warn(`No ISIN found for scheme ${schemeCode}, returning partial data`);
      return partialInsights(schemeCode, schemeName, fundHouse, fallbackManager, [], cachedSectors);
    }

    const response = await fetch(`https://finapi.upvaly.com/api/mf/isin/${isin}`, {
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.warn(`FinAPI error ${response.status} for ${schemeCode}`);
      return partialInsights(schemeCode, schemeName, fundHouse, fallbackManager, [], cachedSectors);
    }

    const json = await response.json();
    const data = json.data?.[0];
    if (!data) {
      console.warn(`FinAPI returned empty data for ${schemeCode}`);
      return partialInsights(schemeCode, schemeName, fundHouse, fallbackManager, [], cachedSectors);
    }

    const holdings: FundHoldings[] = (data.holdings || [])
      .filter((h: any) => h.weightage && parseFloat(h.weightage) > 0)
      .slice(0, 20)
      .map((h: any) => ({
        stockName: h.name,
        allocation: parseFloat(h.weightage),
        sector: h.sector || "Other",
      }));

    const sectorAllocation: Record<string, number> = {};
    (data.sectors || []).forEach((s: any) => {
      sectorAllocation[s.sector] = parseFloat(s.weightage);
    });

    prisma.sectorCache.upsert({
      where: { schemeCode },
      update: { sectorData: sectorAllocation, fetchedAt: new Date() },
      create: { schemeCode, sectorData: sectorAllocation },
    }).catch(() => {});

    const currentPeer = (data.peers || []).find((p: any) => p.schemeCode === schemeCode) || data.peers?.[0];
    const peerManager = getFundManagerFromPeer(currentPeer);
    const dataManager = getFundManagerFromPeer(data);
    const fundManager = peerManager || dataManager || fallbackManager;

    return {
      schemeCode,
      schemeName,
      fundHouse,
      aum: currentPeer?.aum || "N/A",
      expenseRatio: currentPeer?.expenseRatio || "N/A",
      portfolioTurnover: currentPeer?.portfolioTurnover || "N/A",
      fundManager,
      holdings,
      sectorAllocation: Object.keys(sectorAllocation).length ? sectorAllocation : cachedSectors,
      peers: data.peers || [],
    };
  } catch (error) {
    console.error(`Error fetching fund insights for ${schemeCode}:`, error);
    return null;
  }
}
