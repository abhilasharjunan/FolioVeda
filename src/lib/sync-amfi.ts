import { prisma } from "./prisma";
import { fetchAmfiNavAll, AmfiSchemeRecord } from "./amfi";

const DB_BATCH_SIZE = 100; // concurrent upserts per batch — DB-bound, not network-bound

function parseAmfiDate(dateStr: string): Date | null {
  // AMFI dates look like "09-Jul-2026"
  const d = new Date(dateStr);
  return isFinite(d.getTime()) ? d : null;
}

async function runInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  let done = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item) => fn(item).catch(() => {})));
    done += batch.length;
  }
  return done;
}

export interface AmfiSyncResult {
  totalSchemesInFile: number;
  catalogUpserted: number;
  schemeMasterUpdated: number;
  navSnapshotsUpserted: number;
}

/**
 * One AMFI bulk fetch, three DB write targets:
 *
 *  1. SchemeCatalog — upserts every scheme in the file, giving full-universe
 *     autocomplete/search coverage instead of just the curated ~90-scheme
 *     benchmark list + whatever users happen to already hold.
 *  2. SchemeMaster — refreshes latestNav/lastUpdated for schemes that already
 *     exist there, replacing the old sync-nav cron's per-scheme mfapi.in loop
 *     (one external call per held fund) with pure DB writes.
 *  3. NavSnapshot — appends one row per scheme per NAV date for the FULL
 *     universe, building up local return history over time (see
 *     src/lib/nav-snapshots.ts). This is what eventually lets Top Funds rank
 *     schemes outside the curated list without any external calls — but only
 *     once enough history has accumulated, so this is a gradual rollout, not
 *     an instant one.
 *
 * See FolioVeda_Audit_and_Roadmap.md follow-up: full-universe NAV sync via AMFI.
 */
export async function syncAmfiUniverse(): Promise<AmfiSyncResult> {
  const records = await fetchAmfiNavAll();
  if (records.length < 1000) {
    // A healthy NAVAll.txt has ~9,000-12,000 rows. Something's wrong with the
    // fetch/parse if we got far fewer — don't let a bad pull nuke good data.
    throw new Error(`AMFI sync aborted: only parsed ${records.length} scheme records (expected 1000+)`);
  }

  // 1. Full-universe catalog upsert (drives autocomplete/search).
  const catalogUpserted = await runInBatches(records, DB_BATCH_SIZE, async (r: AmfiSchemeRecord) => {
    await prisma.schemeCatalog.upsert({
      where: { schemeCode: r.schemeCode },
      update: {
        schemeName: r.schemeName,
        category: r.category ?? undefined,
        fundHouse: r.amcName || undefined,
      },
      create: {
        schemeCode: r.schemeCode,
        schemeName: r.schemeName,
        category: r.category,
        fundHouse: r.amcName || null,
      },
    });
  });

  // 2. Refresh latestNav for schemes we already track in SchemeMaster (held by
  // users, or part of the curated benchmark list) — skip creating new rows
  // here, since SchemeMaster carries risk fields that should only be populated
  // via the risk-sync cron, not implicitly by a NAV-only sync.
  const existingCodes = new Set(
    (await prisma.schemeMaster.findMany({ select: { schemeCode: true } })).map((s) => s.schemeCode)
  );
  const relevantRecords = records.filter((r) => existingCodes.has(r.schemeCode));

  const schemeMasterUpdated = await runInBatches(relevantRecords, DB_BATCH_SIZE, async (r: AmfiSchemeRecord) => {
    await prisma.schemeMaster.update({
      where: { schemeCode: r.schemeCode },
      data: {
        latestNav: r.nav,
        lastUpdated: parseAmfiDate(r.date) ?? new Date(),
      },
    });
  });

  // 3. Append one NavSnapshot row per scheme for this file's NAV date. Uses
  // the (schemeCode, date) unique constraint so re-running the sync on the
  // same day is a no-op update rather than a duplicate row.
  const navSnapshotsUpserted = await runInBatches(records, DB_BATCH_SIZE, async (r: AmfiSchemeRecord) => {
    const date = parseAmfiDate(r.date);
    if (!date) return; // skip records with an unparseable date rather than snapshotting under today's date, which would corrupt the time series
    await prisma.navSnapshot.upsert({
      where: { schemeCode_date: { schemeCode: r.schemeCode, date } },
      update: { nav: r.nav },
      create: { schemeCode: r.schemeCode, date, nav: r.nav },
    });
  });

  return {
    totalSchemesInFile: records.length,
    catalogUpserted,
    schemeMasterUpdated,
    navSnapshotsUpserted,
  };
}
