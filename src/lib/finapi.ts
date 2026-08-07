import { fetchSchemeDetails } from "./mfapi";
import { prisma } from "./prisma";
import redis from "./redis";

/**
 * Holdings / sector factsheets come from FinAPI (ISIN lookup), not mfapi.in.
 * mfapi only has NAV history + scheme meta.
 *
 * Persistence:
 * - Redis `fundInsights:v4:*` for hot path (6h)
 * - SectorCache.sectorData stores { sectors, holdings } so cold starts survive
 *   Redis misses without re-hitting FinAPI every time
 */
const REDIS_INSIGHTS_TTL_SECONDS = 6 * 3600;
const DB_CACHE_FRESHNESS_HOURS = 24 * 14; // holdings change ~monthly

function getFundManagerFromPeer(peer: any): { name: string; tenure: string; experience: string } | null {
  if (!peer) return null;
  const name = peer.fundManagerName || peer.fund_manager_name || peer.fundManager?.name || null;
  const tenure = peer.fundManagerTenure || peer.fund_manager_tenure || peer.fundManager?.tenure || null;
  const experience = peer.fundManagerExperience || peer.fund_manager_experience || peer.fundManager?.experience || null;
  if (name) return { name, tenure: tenure || "N/A", experience: experience || "N/A" };
  return null;
}

export interface FundHoldings {
  stockName: string;
  ticker?: string;
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
  asOfDate?: string | null;
}

type CachedBlob = {
  sectors?: Record<string, number>;
  holdings?: FundHoldings[];
  asOfDate?: string | null;
};

/** Support legacy flat sector maps and the newer { sectors, holdings } blob. */
export function parseSectorCacheBlob(raw: unknown): CachedBlob {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { sectors: {}, holdings: [] };
  const obj = raw as Record<string, unknown>;

  if (obj.sectors && typeof obj.sectors === "object" && !Array.isArray(obj.sectors)) {
    return {
      sectors: obj.sectors as Record<string, number>,
      holdings: Array.isArray(obj.holdings) ? (obj.holdings as FundHoldings[]) : [],
      asOfDate: typeof obj.asOfDate === "string" ? obj.asOfDate : null,
    };
  }

  // Legacy: entire JSON was a flat sector → % map
  const sectors: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "holdings" || k === "asOfDate" || k === "sectors") continue;
    const n = Number(v);
    if (Number.isFinite(n)) sectors[k] = n;
  }
  return { sectors, holdings: [] };
}

function normalizeHoldings(raw: any[]): FundHoldings[] {
  return (raw || [])
    .map((h: any) => {
      const allocation = parseFloat(String(h.weightage ?? h.weight ?? h.allocation ?? 0).replace(/,/g, ""));
      const stockName = String(h.name || h.company_name || h.companyName || h.stockName || "").trim();
      const ticker = String(h.ticker || h.symbol || h.isin || "").trim() || undefined;
      const sector = String(h.sector || h.industry || "Other").trim() || "Other";
      return { stockName, ticker, allocation, sector };
    })
    .filter((h) => h.stockName && Number.isFinite(h.allocation) && h.allocation > 0)
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, 40);
}

function normalizeSectors(raw: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (const s of raw) {
      const name = String(s.sector || s.name || "").trim();
      const w = parseFloat(String(s.weightage ?? s.weight ?? 0).replace(/,/g, ""));
      if (name && Number.isFinite(w) && w > 0) out[name] = w;
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      const w = Number(v);
      if (Number.isFinite(w) && w > 0) out[k] = w;
    }
  }
  return out;
}

/** FinAPI historically returned `data: [...]`; current API returns `data: { ... }`. */
function unwrapFinapiPayload(json: any): any | null {
  const data = json?.data;
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === "object") return data;
  return null;
}

function partialInsights(
  schemeCode: string,
  schemeName: string,
  fundHouse: string,
  fundManager: FundManager,
  holdings: FundHoldings[] = [],
  sectorAllocation: Record<string, number> = {},
  asOfDate: string | null = null
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
    asOfDate,
  };
}

export async function getFundInsights(schemeCode: string): Promise<FundInsights | null> {
  const redisKey = `fundInsights:v4:${schemeCode}`;

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
    redis.set(redisKey, JSON.stringify(result), "EX", REDIS_INSIGHTS_TTL_SECONDS).catch(() => {});
  }

  return result;
}

async function fetchFundInsightsUncached(schemeCode: string): Promise<FundInsights | null> {
  try {
    const schemeDetails = await fetchSchemeDetails(schemeCode);
    const schemeName =
      schemeDetails.meta?.scheme_name || schemeDetails.schemeName || `Scheme ${schemeCode}`;
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

    let cachedBlob: CachedBlob = { sectors: {}, holdings: [] };
    try {
      const sectorRow = await prisma.sectorCache.findUnique({ where: { schemeCode } });
      if (sectorRow) {
        cachedBlob = parseSectorCacheBlob(sectorRow.sectorData);
        const ageMs = Date.now() - new Date(sectorRow.fetchedAt).getTime();
        const fresh = ageMs < DB_CACHE_FRESHNESS_HOURS * 60 * 60 * 1000;
        if (fresh && (cachedBlob.holdings?.length || 0) > 0) {
          return partialInsights(
            schemeCode,
            schemeName,
            fundHouse,
            fallbackManager,
            cachedBlob.holdings,
            cachedBlob.sectors || {},
            cachedBlob.asOfDate || null
          );
        }
      }
    } catch {
      // ignore cache read errors
    }

    const isin = schemeDetails.meta?.isin_growth || schemeDetails.meta?.isin_div_reinvestment;
    if (!isin) {
      console.warn(`No ISIN found for scheme ${schemeCode}`);
      return partialInsights(
        schemeCode,
        schemeName,
        fundHouse,
        fallbackManager,
        cachedBlob.holdings || [],
        cachedBlob.sectors || {}
      );
    }

    let response: Response;
    try {
      response = await fetch(`https://finapi.upvaly.com/api/mf/isin/${encodeURIComponent(isin)}`, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      console.warn(`FinAPI network error for ${schemeCode}:`, err);
      return partialInsights(
        schemeCode,
        schemeName,
        fundHouse,
        fallbackManager,
        cachedBlob.holdings || [],
        cachedBlob.sectors || {}
      );
    }

    if (!response.ok) {
      console.warn(`FinAPI error ${response.status} for ${schemeCode} (ISIN ${isin})`);
      return partialInsights(
        schemeCode,
        schemeName,
        fundHouse,
        fallbackManager,
        cachedBlob.holdings || [],
        cachedBlob.sectors || {}
      );
    }

    const json = await response.json();
    const data = unwrapFinapiPayload(json);
    if (!data) {
      console.warn(`FinAPI empty payload for ${schemeCode}`);
      return partialInsights(
        schemeCode,
        schemeName,
        fundHouse,
        fallbackManager,
        cachedBlob.holdings || [],
        cachedBlob.sectors || {}
      );
    }

    const holdings = normalizeHoldings(data.holdings || data.portfolio?.holdings || []);
    const sectorAllocation = normalizeSectors(data.sectors || data.portfolio?.sectors || {});
    const asOfDate =
      data.portfolio?.asOfDate ||
      data.portfolio?.as_of_date ||
      data.latestNavDate ||
      null;

    if (holdings.length || Object.keys(sectorAllocation).length) {
      const blob: CachedBlob = {
        sectors: Object.keys(sectorAllocation).length ? sectorAllocation : cachedBlob.sectors,
        holdings: holdings.length ? holdings : cachedBlob.holdings,
        asOfDate,
      };
      prisma.sectorCache
        .upsert({
          where: { schemeCode },
          update: { sectorData: blob as any, fetchedAt: new Date() },
          create: { schemeCode, sectorData: blob as any },
        })
        .catch(() => {});
    }

    const currentPeer =
      (data.peers || []).find((p: any) => String(p.schemeCode) === String(schemeCode)) ||
      data.peers?.[0];
    const managers = data.schemeFundManagers || [];
    const mgrFromList = managers[0]
      ? {
          name: managers[0].name || managers[0].fundManagerName || "Not Available",
          tenure: managers[0].tenure || managers[0].experience || "N/A",
          experience: managers[0].experience || "N/A",
        }
      : null;
    const fundManager =
      getFundManagerFromPeer(currentPeer) ||
      getFundManagerFromPeer(data) ||
      mgrFromList ||
      fallbackManager;

    return {
      schemeCode,
      schemeName: data.schemeName || schemeName,
      fundHouse: data.fundHouse || data.companyName || fundHouse,
      aum: String(currentPeer?.aum ?? data.aum ?? "N/A"),
      expenseRatio: String(currentPeer?.expenseRatio ?? data.expenseRatio ?? "N/A"),
      portfolioTurnover: String(currentPeer?.portfolioTurnover ?? data.portfolioTurnover ?? "N/A"),
      fundManager,
      holdings,
      sectorAllocation: Object.keys(sectorAllocation).length
        ? sectorAllocation
        : cachedBlob.sectors || {},
      peers: data.peers || [],
      asOfDate,
    };
  } catch (error) {
    console.error(`Error fetching fund insights for ${schemeCode}:`, error);
    return null;
  }
}
