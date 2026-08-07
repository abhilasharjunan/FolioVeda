import { prisma } from "@/lib/prisma";
import {
  BENCHMARK_SCHEMES,
  FundCategory,
  calculateCAGR,
  computePeriodReturnsFromMfapi,
  getHistoricalNav,
} from "@/lib/funds";
import { computeReturnsFromSnapshots, hasMinimumHistory, RETURN_WINDOWS } from "@/lib/nav-snapshots";
import { isDirectGrowthScheme } from "@/lib/scheme-filters";
import { refreshTopFundsRedisFromDb } from "@/lib/top-funds-cache";

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

interface RankedFund {
  schemeCode: string;
  schemeName: string;
  fundHouse: string | null;
  nav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
}

function mergeReturns(
  primary: Record<string, number | null>,
  fallback: Record<string, number | null>
): Record<string, number | null> {
  const out = { ...primary };
  for (const [k, v] of Object.entries(fallback)) {
    if (out[k] == null && v != null) out[k] = v;
  }
  return out;
}

/** Local NavSnapshot history is often only weeks old — treat as complete only when 1Y/3Y exists. */
function hasLongHorizonReturns(returns: Record<string, number | null>): boolean {
  return returns["3Y"] != null || returns["1Y"] != null;
}

async function enrichReturnsFromMfapi(fund: RankedFund): Promise<RankedFund> {
  if (hasLongHorizonReturns(fund.returns) && fund.sinceInception != null) {
    return fund;
  }
  try {
    const mf = await computePeriodReturnsFromMfapi(fund.schemeCode);
    if (!mf) return fund;
    return {
      ...fund,
      nav: fund.nav || mf.nav,
      returns: mergeReturns(fund.returns, mf.returns),
      sinceInception: fund.sinceInception ?? mf.sinceInception,
    };
  } catch (e) {
    console.warn(`mfapi return backfill failed for ${fund.schemeCode}:`, e);
    return fund;
  }
}

/**
 * Curated ~90-scheme list. Prefer local NavSnapshot history when long-horizon
 * windows exist; otherwise fill missing windows from mfapi.in (local snapshots
 * alone often only cover ~1M after a fresh deploy).
 */
async function getCuratedCandidates(cat: FundCategory): Promise<RankedFund[]> {
  const schemes = BENCHMARK_SCHEMES.filter((s) => s.category === cat);
  const results: RankedFund[] = [];

  const CONCURRENCY = 6;
  for (let i = 0; i < schemes.length; i += CONCURRENCY) {
    const batch = schemes.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async (scheme): Promise<RankedFund | null> => {
      try {
        const lookbackDate = new Date(Date.now() - RECENT_SNAPSHOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
        const recent = await prisma.navSnapshot.findFirst({
          where: { schemeCode: scheme.schemeCode, date: { gte: lookbackDate } },
          orderBy: { date: "desc" },
          select: { nav: true, date: true },
        });

        if (recent) {
          const local = await computeReturnsFromSnapshots(scheme.schemeCode, Number(recent.nav));
          if (hasMinimumHistory(local.earliestSnapshotDate) && hasLongHorizonReturns(local.returns)) {
            return {
              schemeCode: scheme.schemeCode,
              schemeName: scheme.schemeName,
              fundHouse: "Mutual Fund",
              nav: Number(recent.nav),
              returns: local.returns,
              sinceInception: local.sinceInception,
            };
          }

          // Thin local history (e.g. only 1M) — keep local shorts, fill longer windows from mfapi.
          if (hasMinimumHistory(local.earliestSnapshotDate)) {
            const mf = await computePeriodReturnsFromMfapi(scheme.schemeCode);
            if (mf) {
              return {
                schemeCode: scheme.schemeCode,
                schemeName: scheme.schemeName,
                fundHouse: "Mutual Fund",
                nav: Number(recent.nav),
                returns: mergeReturns(local.returns, mf.returns),
                sinceInception: local.sinceInception ?? mf.sinceInception,
              };
            }
          }
        }

        const mf = await computePeriodReturnsFromMfapi(scheme.schemeCode);
        if (mf) {
          return {
            schemeCode: scheme.schemeCode,
            schemeName: scheme.schemeName,
            fundHouse: "Mutual Fund",
            nav: mf.nav,
            returns: mf.returns,
            sinceInception: mf.sinceInception,
          };
        }

        const currentNav = await getHistoricalNav(scheme.schemeCode, 0);
        if (!currentNav) return null;

        const returns: Record<string, number | null> = {};
        for (const [label, days] of Object.entries(RETURN_WINDOWS)) {
          const pastNav = await getHistoricalNav(scheme.schemeCode, days);
          returns[label] = pastNav ? calculateCAGR(currentNav, pastNav, days) : null;
        }

        return {
          schemeCode: scheme.schemeCode,
          schemeName: scheme.schemeName,
          fundHouse: "Mutual Fund",
          nav: currentNav,
          returns,
          sinceInception: returns["10Y"],
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
    orderBy: { schemeName: "asc" },
    take: FULL_UNIVERSE_CANDIDATES_PER_CATEGORY * 3,
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

    const curatedCodeSet = new Set(curated.map((f) => f.schemeCode));
    const catalogNames =
      curatedCodeSet.size > 0
        ? await prisma.schemeCatalog.findMany({
            where: { schemeCode: { in: [...curatedCodeSet] } },
            select: { schemeCode: true, schemeName: true },
          })
        : [];
    const catalogNameByCode = new Map(catalogNames.map((s) => [s.schemeCode, s.schemeName]));

    for (const f of curated) {
      const catalogName = catalogNameByCode.get(f.schemeCode);
      if (catalogName) {
        const entry = merged.get(f.schemeCode);
        if (entry) entry.schemeName = catalogName;
      }
    }

    const eligible = Array.from(merged.values()).filter((f) => {
      if (curatedCodeSet.has(f.schemeCode)) return true;
      const catalogName = catalogNameByCode.get(f.schemeCode);
      return isDirectGrowthScheme(catalogName || f.schemeName);
    });

    const TARGET_PER_CATEGORY = 10;
    const sortedThin = eligible
      .sort((a, b) => {
        const score = (f: RankedFund) =>
          f.returns["3Y"] ?? f.returns["1Y"] ?? f.returns["1M"] ?? -Infinity;
        return score(b) - score(a);
      })
      .slice(0, TARGET_PER_CATEGORY);

    // Backfill mfapi for finalists still missing long-horizon returns.
    const sorted: RankedFund[] = [];
    for (const fund of sortedThin) {
      sorted.push(await enrichReturnsFromMfapi(fund));
    }
    sorted.sort((a, b) => (b.returns["3Y"] ?? -Infinity) - (a.returns["3Y"] ?? -Infinity));

    if (sorted.length < TARGET_PER_CATEGORY) {
      console.warn(
        `Top funds sync: ${cat} only ranked ${sorted.length}/${TARGET_PER_CATEGORY} schemes`
      );
    }

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

  await refreshTopFundsRedisFromDb();

  return results;
}
