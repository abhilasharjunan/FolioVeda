import { prisma } from "./prisma";
import { calculateCAGR } from "./funds";

/**
 * Local-history return calculator built on the NavSnapshot table (see
 * schema.prisma), which accumulates daily NAV history for the full AMFI
 * universe via syncAmfiUniverse(). This lets Top Funds compute returns for
 * schemes outside the curated BENCHMARK_SCHEMES list without any external
 * API calls — but only once enough history has accumulated locally.
 *
 * Rollout note: history starts accumulating from whenever the sync-nav cron
 * first runs. There is no backfill of past NAV data, so full-universe
 * coverage grows gradually over weeks/months, not instantly.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const RETURN_WINDOWS: Record<string, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 3 * 365,
  "5Y": 5 * 365,
  "10Y": 10 * 365,
};

/** How far a snapshot's date may drift from the exact target and still count for that window (AMFI publishes on business days only, so weekends/holidays need slack). */
const SNAPSHOT_TOLERANCE_DAYS = 7;

/** Minimum accumulated history (in days, from earliest snapshot to now) before a scheme is trusted for full-universe ranking at all. */
export const MIN_SNAPSHOT_HISTORY_DAYS = 25;

export interface LocalReturns {
  schemeCode: string;
  currentNav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
  earliestSnapshotDate: Date | null;
  snapshotCount: number;
}

export function hasMinimumHistory(earliestDate: Date | null, asOf: Date = new Date()): boolean {
  if (!earliestDate) return false;
  return (asOf.getTime() - earliestDate.getTime()) / DAY_MS >= MIN_SNAPSHOT_HISTORY_DAYS;
}

/**
 * Computes CAGR/absolute returns for every window in RETURN_WINDOWS using
 * only locally-stored NavSnapshot rows for this scheme — no network calls.
 * Windows without a snapshot close enough to the target date resolve to
 * null rather than guessing.
 */
export async function computeReturnsFromSnapshots(
  schemeCode: string,
  currentNav: number,
  asOf: Date = new Date()
): Promise<LocalReturns> {
  const snapshots = await prisma.navSnapshot.findMany({
    where: { schemeCode },
    orderBy: { date: "asc" },
    select: { nav: true, date: true },
  });

  const emptyReturns = Object.fromEntries(Object.keys(RETURN_WINDOWS).map((k) => [k, null])) as Record<string, number | null>;

  if (snapshots.length === 0) {
    return { schemeCode, currentNav, returns: emptyReturns, sinceInception: null, earliestSnapshotDate: null, snapshotCount: 0 };
  }

  const findClosest = (targetTime: number): { nav: number; date: Date } | null => {
    let best = snapshots[0];
    let bestDiff = Math.abs(snapshots[0].date.getTime() - targetTime);
    for (const s of snapshots) {
      const diff = Math.abs(s.date.getTime() - targetTime);
      if (diff < bestDiff) {
        best = s;
        bestDiff = diff;
      }
    }
    return bestDiff <= SNAPSHOT_TOLERANCE_DAYS * DAY_MS ? { nav: Number(best.nav), date: best.date } : null;
  };

  const returns: Record<string, number | null> = {};
  for (const [label, days] of Object.entries(RETURN_WINDOWS)) {
    const target = findClosest(asOf.getTime() - days * DAY_MS);
    returns[label] = target ? calculateCAGR(currentNav, target.nav, days) : null;
  }

  const earliest = snapshots[0];
  const daysSinceEarliest = Math.round((asOf.getTime() - earliest.date.getTime()) / DAY_MS);
  const sinceInception = daysSinceEarliest > 30 ? calculateCAGR(currentNav, Number(earliest.nav), daysSinceEarliest) : null;

  return {
    schemeCode,
    currentNav,
    returns,
    sinceInception,
    earliestSnapshotDate: earliest.date,
    snapshotCount: snapshots.length,
  };
}
