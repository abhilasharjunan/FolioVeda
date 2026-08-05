import { prisma } from "@/lib/prisma";
import { BENCHMARK_SCHEMES, FundCategory, calculateCAGR, getHistoricalNav } from "@/lib/funds";
import { computeReturnsFromSnapshots, hasMinimumHistory, RETURN_WINDOWS } from "@/lib/nav-snapshots";
import { isDirectGrowthScheme } from "@/lib/scheme-filters";
import redis from "@/lib/redis";

const CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap",
  "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
];

// A single run across all 9 categories does live mfapi.in calls per scheme
// and can't reliably finish inside Vercel's per-invocation time limit (Hobby
// caps at 60s). CATEGORY_BATCHES splits the work into smaller cron-triggered
// chunks (see vercel.json + the `batch` query param on the sync-top-funds
// route) that each comfortably fit within that budget.
export const CATEGORY_BATCHES: FundCategory[][] = [
  ["Large Cap", "Mid Cap", "Small Cap"],
  ["Flexi Cap", "ELSS", "Debt"],
  ["Hybrid", "Index Funds", "International Funds"],
];

const FULL_UNIVERSE_CANDIDATES_PER_CATEGORY = 200;
const RECENT_SNAPSHOT_LOOKBACK_DAYS = 14;
const REDIS_TOP_FUNDS_KEY = "funds:top-performing:v2";

interface RankedFund {
  schemeCode: string;
  schemeName: string;
  fundHouse: string | null;
  nav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
}

/**
 * Curated ~90-scheme list. Prefer locally stored NavSnapshot history (no
 * network) when enough history exists; fall back to live mfapi.in only when
 * snapshots are missing — keeps the daily cron inside Vercel's time budget.
 */
async function getCuratedCandidates(cat: FundCategory): Promise<RankedFund[]> {
  const schemes = BENCHMARK_SCHEMES.filter((s) => s.category === cat);
  const results: RankedFund[] = [];

  const CONCURRENCY = 6;
  for (let i = 0; i < schemes.length; i += CONCURRENCY) {
    const batch = schemes.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async (scheme): Promise<RankedFund | null> => {
      try {
        // Try local snapshots first (same path as full-universe ranking).
        const lookbackDate = new Date(Date.now() - RECENT_SNAPSHOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
        const recent = await prisma.navSnapshot.findFirst({
          where: { schemeCode: scheme.schemeCode, date: { gte: lookbackDate } },
          orderBy: { date: "desc" },
          select: { nav: true, date: true },
        });

        if (recent) {
          const local = await computeReturnsFromSnapshots(scheme.schemeCode, Number(recent.nav));
          if (hasMinimumHistory(local.earliestSnapshotDate)) {
            return {
              schemeCode: scheme.schemeCode,
              schemeName: scheme.schemeName,
              fundHouse: "Mutual Fund",
              nav: Number(recent.nav),
              returns: local.returns,
              sinceInception: local.sinceInception,
            };
          }
        }

        // Fallback: live mfapi.in (slower; only when snapshots are thin).
        const currentNav = await getHistoricalNav(scheme.schemeCode, 0);
        if (!currentNav) return null;

        const returns: Record<string, number | null> = {};
        let oldestNav = currentNav;

        for (const [label, days] of Object.entries(RETURN_WINDOWS)) {
          const pastNav = await getHistoricalNav(scheme.schemeCode, days);
          returns[label] = pastNav ? calculateCAGR(currentNav, pastNav, days) : null;
          if (pastNav && pastNav < oldestNav) oldestNav = pastNav;
        }

        const inceptionCagr = calculateCAGR(currentNav, oldestNav, 365 * 10);

        return {
          schemeCode: scheme.schemeCode,
          schemeName: scheme.schemeName,
          fundHouse: "Mutual Fund",
          nav: currentNav,
          returns,
          sinceInception: inceptionCagr,
        };
      } catch (e) {
        console.error(`Error fetching ${scheme.schemeCode}:`, e);
        return null;
      }
    }));

    results.push(...batchResults.filter((r): r is RankedFund => r !== null));
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

/**
 * Full AMFI universe candidates from SchemeCatalog, ranked from NavSnapshot
 * history only. Direct Growth plans only — Regular / IDCW / Dividend excluded.
 */
async function getFullUniverseCandidates(cat: FundCategory): Promise<RankedFund[]> {
  const schemes = await prisma.schemeCatalog.findMany({
    where: { category: cat },
    select: { schemeCode: true, schemeName: true, fundHouse: true },
    take: FULL_UNIVERSE_CANDIDATES_PER_CATEGORY * 3, // oversample then filter Direct Growth
  });
  if (schemes.length === 0) return [];

  const directGrowth = schemes
    .filter((s) => isDirectGrowthScheme(s.schemeName))
    .slice(0, FULL_UNIVERSE_CANDIDATES_PER_CATEGORY);
  if (directGrowth.length === 0) return [];

  const schemeCodes = directGrowth.map((s) => s.schemeCode);
  const lookbackDate = new Date(Date.now() - RECENT_SNAPSHOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const recentSnapshots = await prisma.navSnapshot.findMany({
    where: { schemeCode: { in: schemeCodes }, date: { gte: lookbackDate } },
    orderBy: { date: "desc" },
    select: { schemeCode: true, nav: true, date: true },
  });

  const latestByScheme = new Map<string, { nav: number; date: Date }>();
  for (const snap of recentSnapshots) {
    if (!latestByScheme.has(snap.schemeCode)) {
      latestByScheme.set(snap.schemeCode, { nav: Number(snap.nav), date: snap.date });
    }
  }

  const results: RankedFund[] = [];
  for (const scheme of directGrowth) {
    const latest = latestByScheme.get(scheme.schemeCode);
    if (!latest) continue;

    const local = await computeReturnsFromSnapshots(scheme.schemeCode, latest.nav);
    if (!hasMinimumHistory(local.earliestSnapshotDate)) continue;

    results.push({
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
      fundHouse: scheme.fundHouse,
      nav: latest.nav,
      returns: local.returns,
      sinceInception: local.sinceInception,
    });
  }

  return results;
}

export async function syncTopFundsCache(categories: FundCategory[] = CATEGORIES) {
  const results: Record<string, RankedFund[]> = {};

  for (const cat of categories) {
    const [curated, fullUniverse] = await Promise.all([
      getCuratedCandidates(cat),
      getFullUniverseCandidates(cat),
    ]);

    const merged = new Map<string, RankedFund>();
    for (const f of curated) merged.set(f.schemeCode, f);
    for (const f of fullUniverse) if (!merged.has(f.schemeCode)) merged.set(f.schemeCode, f);

    // Safety net: drop Regular / IDCW even if a curated display name slipped through.
    // Curated BENCHMARK names sometimes omit "Direct/Growth" in the short label while
    // the scheme code itself is Direct Growth — keep those (they come from curated).
    const curatedCodes = new Set(curated.map((f) => f.schemeCode));
    const eligible = Array.from(merged.values()).filter(
      (f) => curatedCodes.has(f.schemeCode) || isDirectGrowthScheme(f.schemeName)
    );

    const sorted = eligible
      .sort((a, b) => (b.returns["3Y"] ?? -Infinity) - (a.returns["3Y"] ?? -Infinity))
      .slice(0, 10);

    results[cat] = sorted;

    for (const [idx, fund] of sorted.entries()) {
      await prisma.topFundsCache.upsert({
        where: { category_schemeCode: { category: cat, schemeCode: fund.schemeCode } },
        update: {
          schemeName: fund.schemeName,
          fundHouse: fund.fundHouse,
          nav: fund.nav,
          returns: fund.returns,
          sinceInception: fund.sinceInception,
          rank: idx + 1,
        },
        create: {
          category: cat,
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          fundHouse: fund.fundHouse,
          nav: fund.nav,
          returns: fund.returns,
          sinceInception: fund.sinceInception,
          rank: idx + 1,
        },
      });
    }

    if (sorted.length > 0) {
      await prisma.topFundsCache.deleteMany({
        where: {
          category: cat,
          schemeCode: { notIn: sorted.map((f) => f.schemeCode) },
        },
      });
    }
  }

  // Invalidate the page-facing Redis payload so the next read rebuilds from DB.
  if (redis) {
    redis.del(REDIS_TOP_FUNDS_KEY).catch(() => {});
  }

  return results;
}
