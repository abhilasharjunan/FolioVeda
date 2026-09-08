import { fetchSchemeDetails } from "./mfapi";
import { prisma } from "./prisma";
import redis from "./redis";

/**
 * Holdings / sector factsheets come from FinAPI, not mfapi.in (mfapi only has
 * NAV history + scheme meta).
 *
 * FinAPI's public `/mf/isin/{isin}` endpoint only returns NAV/meta — the
 * security-level holdings moved to `/mf/holdings-history/*`, which is a paid
 * ("Pro") endpoint requiring an `X-API-Key`. So:
 *  - With `FINAPI_API_KEY` set, we pull fresh monthly holdings from there.
 *  - Without it, we serve whatever holdings are already in SectorCache
 *    (populated when the feed last worked). Stale disclosed holdings are far
 *    more useful for overlap than nothing, and AMC portfolios only change
 *    monthly, so we keep serving the cache regardless of age and just try to
 *    refresh it when a key is available.
 *
 * Persistence:
 * - Redis `fundInsights:v4:*` for hot path (6h)
 * - SectorCache.sectorData stores { sectors, holdings } so cold starts survive
 *   Redis misses without re-hitting FinAPI every time
 */
const REDIS_INSIGHTS_TTL_SECONDS = 6 * 3600;
/** Below this age we skip the (rate-limited) Pro refetch and trust the cache as-is. */
const DB_CACHE_FRESH_HOURS = 24 * 25; // AMC disclosures are monthly
const FINAPI_BASE = "https://finapi.upvaly.com/api";
const FINAPI_API_KEY = process.env.FINAPI_API_KEY || "";

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

/** MM-YYYY, the format FinAPI's holdings-history range params expect. */
function monthParam(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

interface FreshHoldings {
  holdings: FundHoldings[];
  sectors: Record<string, number>;
  asOfDate: string | null;
}

/**
 * FinAPI Pro: month-wise security-level holdings sourced from AMC factsheets.
 * Returns the most recent month available, or null when there's no key, the
 * key isn't Pro (401/403), or no history exists (data starts Jan 2026).
 */
async function fetchHoldingsHistory(isin: string): Promise<FreshHoldings | null> {
  if (!FINAPI_API_KEY) return null;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 4, 1);
  const url =
    `${FINAPI_BASE}/mf/holdings-history/isin/${encodeURIComponent(isin)}` +
    `?startMonth=${monthParam(start)}&endMonth=${monthParam(now)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json", "X-API-Key": FINAPI_API_KEY },
    });
  } catch (err) {
    console.warn(`FinAPI holdings-history network error for ISIN ${isin}:`, err);
    return null;
  }
  if (!res.ok) {
    console.warn(`FinAPI holdings-history ${res.status} for ISIN ${isin}`);
    return null;
  }

  const data = unwrapFinapiPayload(await res.json());
  const history: any[] = Array.isArray(data?.holdingsHistory) ? data.holdingsHistory : [];
  if (history.length === 0) return null;

  const monthKey = (h: any) => Number(h.holdingsYear) * 100 + Number(h.holdingsMonth);
  const latest = history.reduce((best, cur) => (monthKey(cur) > monthKey(best) ? cur : best));

  const holdings = normalizeHoldings(
    (latest.holdings || []).map((h: any) => ({
      name: h.displayName || h.name,
      weightage: h.weightage ?? h.weight,
      sector: h.sectorClassification?.sector || h.sector,
    }))
  );
  if (!holdings.length) return null;

  // Holdings-history has no top-level sector block — derive a directional one
  // from the disclosed names (calculateLookThroughSectors renormalizes anyway).
  const sectors: Record<string, number> = {};
  for (const h of holdings) {
    if (!h.sector || h.sector === "Other") continue;
    sectors[h.sector] = (sectors[h.sector] || 0) + h.allocation;
  }

  const asOfDate =
    latest.holdingsAsOf ||
    (latest.holdingsMonth && latest.holdingsYear
      ? `${latest.holdingsYear}-${String(latest.holdingsMonth).padStart(2, "0")}`
      : null);

  return { holdings, sectors, asOfDate };
}

async function fetchFundInsightsUncached(schemeCode: string): Promise<FundInsights | null> {
  try {
    const schemeDetails = await fetchSchemeDetails(schemeCode);
    const schemeName =
      schemeDetails.meta?.scheme_name || schemeDetails.schemeName || `Scheme ${schemeCode}`;
    const fundHouse = schemeDetails.meta?.fund_house || "N/A";
    const isin =
      schemeDetails.meta?.isin_growth || schemeDetails.meta?.isin_div_reinvestment || null;

    const dbScheme = await prisma.schemeMaster.findUnique({
      where: { schemeCode },
      select: { fundManagerName: true, fundManagerTenure: true },
    });
    const fallbackManager: FundManager = {
      name: dbScheme?.fundManagerName || "Not Available",
      tenure: dbScheme?.fundManagerTenure || "N/A",
      experience: "N/A",
    };

    // 1. Whatever holdings we already have cached, regardless of age.
    let cachedBlob: CachedBlob = { sectors: {}, holdings: [] };
    let cacheAgeMs = Infinity;
    try {
      const sectorRow = await prisma.sectorCache.findUnique({ where: { schemeCode } });
      if (sectorRow) {
        cachedBlob = parseSectorCacheBlob(sectorRow.sectorData);
        cacheAgeMs = Date.now() - new Date(sectorRow.fetchedAt).getTime();
      }
    } catch {
      // ignore cache read errors
    }
    const cacheHasHoldings = (cachedBlob.holdings?.length || 0) > 0;
    const cacheFresh = cacheAgeMs < DB_CACHE_FRESH_HOURS * 60 * 60 * 1000;

    // 2. Refresh from FinAPI Pro only when the cache can't answer (missing or
    //    stale) — and only if we have a key at all. No key ⇒ cache is it.
    const fresh =
      isin && !(cacheHasHoldings && cacheFresh) ? await fetchHoldingsHistory(isin) : null;

    const holdings = fresh?.holdings.length ? fresh.holdings : cachedBlob.holdings || [];
    const sectorAllocation =
      fresh && Object.keys(fresh.sectors).length ? fresh.sectors : cachedBlob.sectors || {};
    const asOfDate = fresh?.asOfDate || cachedBlob.asOfDate || null;

    // 3. Persist a successful refresh so the next cold start has it.
    if (fresh?.holdings.length) {
      const blob: CachedBlob = { sectors: sectorAllocation, holdings, asOfDate };
      prisma.sectorCache
        .upsert({
          where: { schemeCode },
          update: { sectorData: blob as any, fetchedAt: new Date() },
          create: { schemeCode, sectorData: blob as any },
        })
        .catch(() => {});
    }

    return partialInsights(
      schemeCode,
      schemeName,
      fundHouse,
      fallbackManager,
      holdings,
      sectorAllocation,
      asOfDate
    );
  } catch (error) {
    console.error(`Error fetching fund insights for ${schemeCode}:`, error);
    return null;
  }
}
