import { prisma } from "@/lib/prisma";
import { BENCHMARK_SCHEMES, FundCategory, calculateCAGR, getHistoricalNav } from "@/lib/funds";
import { computeReturnsFromSnapshots, hasMinimumHistory, RETURN_WINDOWS } from "@/lib/nav-snapshots";

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

// Cap on how many full-universe SchemeCatalog candidates we evaluate per
// category per run. Bounds DB work while NavSnapshot history is still thin;
// most candidates will fail the minimum-history gate early on anyway. Can be
// raised once NavSnapshot coverage/perf is proven out in production.
const FULL_UNIVERSE_CANDIDATES_PER_CATEGORY = 200;
const RECENT_SNAPSHOT_LOOKBACK_DAYS = 14;

interface RankedFund {
  schemeCode: string;
  schemeName: string;
  fundHouse: string | null;
  nav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
}

/** Original data source: the curated ~90-scheme benchmark list, refreshed live from mfapi.in on every run. */
async function getCuratedCandidates(cat: FundCategory): Promise<RankedFund[]> {
  const schemes = BENCHMARK_SCHEMES.filter((s) => s.category === cat);
  const results: RankedFund[] = [];

  const CONCURRENCY = 6;
  for (let i = 0; i < schemes.length; i += CONCURRENCY) {
    const batch = schemes.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async (scheme): Promise<RankedFund | null> => {
      try {
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
 * New data source (item 5): schemes from the full AMFI universe (SchemeCatalog),
 * ranked using locally-accumulated NavSnapshot history — no external calls.
 * Schemes without enough accumulated history are silently skipped rather than
 * ranked on incomplete data; coverage grows as NavSnapshot rows accumulate.
 */
async function getFullUniverseCandidates(cat: FundCategory): Promise<RankedFund[]> {
  const schemes = await prisma.schemeCatalog.findMany({
    where: { category: cat },
    select: { schemeCode: true, schemeName: true, fundHouse: true },
    take: FULL_UNIVERSE_CANDIDATES_PER_CATEGORY,
  });
  if (schemes.length === 0) return [];

  const schemeCodes = schemes.map((s) => s.schemeCode);
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
  for (const scheme of schemes) {
    const latest = latestByScheme.get(scheme.schemeCode);
    if (!latest) continue; // no recent snapshot yet — sync hasn't covered it or it's stale

    const local = await computeReturnsFromSnapshots(scheme.schemeCode, latest.nav);
    if (!hasMinimumHistory(local.earliestSnapshotDate)) continue; // not enough accumulated history to trust yet

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

  // Persist each category's ranking as soon as it's computed, rather than
  // collecting all requested categories and writing at the very end — a live
  // mfapi.in call can stall/timeout mid-run, and this way whatever
  // categories finished before that still land in the cache instead of the
  // whole sync losing all progress.
  for (const cat of categories) {
    const [curated, fullUniverse] = await Promise.all([
      getCuratedCandidates(cat),
      getFullUniverseCandidates(cat),
    ]);

    // Curated (live mfapi.in) data wins on overlap — it's refreshed every run
    // and has full return-window coverage, whereas full-universe candidates
    // depend on however much NavSnapshot history has accumulated so far.
    const merged = new Map<string, RankedFund>();
    for (const f of curated) merged.set(f.schemeCode, f);
    for (const f of fullUniverse) if (!merged.has(f.schemeCode)) merged.set(f.schemeCode, f);

    const sorted = Array.from(merged.values())
      // nulls (missing 3Y data) sort last instead of being treated as a 0% return
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

    // Drop rows that fell out of this category's top 10 — upsert alone never
    // removes anything, so a scheme that used to rank #8 but no longer
    // qualifies would otherwise linger in the cache forever. Skip when sorted
    // is empty: an empty result usually means every candidate fetch failed
    // for this run, and `notIn: []` would otherwise wipe the whole category
    // instead of just leaving last run's (still-good) data in place.
    if (sorted.length > 0) {
      await prisma.topFundsCache.deleteMany({
        where: {
          category: cat,
          schemeCode: { notIn: sorted.map((f) => f.schemeCode) },
        },
      });
    }
  }

  return results;
}
