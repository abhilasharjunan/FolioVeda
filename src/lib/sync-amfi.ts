import { prisma } from "./prisma";
import { fetchAmfiNavAll, AmfiSchemeRecord } from "./amfi";
import { randomUUID } from "crypto";

// Bulk set-based upserts (one round trip per chunk via unnest + ON CONFLICT)
// instead of one query per row. The full AMFI universe is ~14,000 schemes;
// row-at-a-time upserts took 200s+ against Neon and blew past Vercel's
// function time limit, so every scheduled cron run was failing silently.
const SQL_CHUNK_SIZE = 2000;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function parseAmfiDate(dateStr: string): Date | null {
  // AMFI dates look like "09-Jul-2026"
  const d = new Date(dateStr);
  return isFinite(d.getTime()) ? d : null;
}

async function bulkUpsertSchemeCatalog(records: AmfiSchemeRecord[]): Promise<number> {
  for (const batch of chunk(records, SQL_CHUNK_SIZE)) {
    const ids = batch.map(() => randomUUID());
    const codes = batch.map((r) => r.schemeCode);
    const names = batch.map((r) => r.schemeName);
    const categories = batch.map((r) => r.category);
    const fundHouses = batch.map((r) => r.amcName || null);

    await prisma.$executeRaw`
      INSERT INTO "SchemeCatalog" ("id", "schemeCode", "schemeName", "category", "fundHouse", "updatedAt")
      SELECT id, code, name, cat, house, now()
      FROM unnest(${ids}::text[], ${codes}::text[], ${names}::text[], ${categories}::text[], ${fundHouses}::text[])
        AS t(id, code, name, cat, house)
      ON CONFLICT ("schemeCode") DO UPDATE SET
        "schemeName" = EXCLUDED."schemeName",
        "category" = COALESCE(EXCLUDED."category", "SchemeCatalog"."category"),
        "fundHouse" = COALESCE(EXCLUDED."fundHouse", "SchemeCatalog"."fundHouse"),
        "updatedAt" = now()
    `;
  }
  return records.length;
}

/**
 * Refreshes latestNav/lastUpdated for schemes already tracked in SchemeMaster
 * (held by users, or part of the curated benchmark list). The join against
 * unnest() naturally no-ops for schemeCodes with no matching SchemeMaster
 * row, so there's no need to pre-filter to "existing" codes first.
 */
async function bulkUpdateSchemeMaster(records: AmfiSchemeRecord[]): Promise<number> {
  let updated = 0;
  for (const batch of chunk(records, SQL_CHUNK_SIZE)) {
    const codes = batch.map((r) => r.schemeCode);
    const navs = batch.map((r) => r.nav.toString());
    const dates = batch.map((r) => (parseAmfiDate(r.date) ?? new Date()).toISOString());

    const result = await prisma.$executeRaw`
      UPDATE "SchemeMaster" AS sm
      SET "latestNav" = t.nav::decimal, "lastUpdated" = t.d::timestamp
      FROM unnest(${codes}::text[], ${navs}::text[], ${dates}::text[]) AS t(code, nav, d)
      WHERE sm."schemeCode" = t.code
    `;
    updated += Number(result);
  }
  return updated;
}

async function bulkUpsertNavSnapshots(records: AmfiSchemeRecord[]): Promise<number> {
  const withDates = records
    .map((r) => ({ r, date: parseAmfiDate(r.date) }))
    // skip records with an unparseable date rather than snapshotting under
    // today's date, which would corrupt the time series
    .filter((x): x is { r: AmfiSchemeRecord; date: Date } => x.date !== null);

  for (const batch of chunk(withDates, SQL_CHUNK_SIZE)) {
    const ids = batch.map(() => randomUUID());
    const codes = batch.map((x) => x.r.schemeCode);
    const navs = batch.map((x) => x.r.nav.toString());
    const dates = batch.map((x) => x.date.toISOString().slice(0, 10));

    await prisma.$executeRaw`
      INSERT INTO "NavSnapshot" ("id", "schemeCode", "nav", "date")
      SELECT id, code, nav::decimal, d::date
      FROM unnest(${ids}::text[], ${codes}::text[], ${navs}::text[], ${dates}::text[]) AS t(id, code, nav, d)
      ON CONFLICT ("schemeCode", "date") DO UPDATE SET "nav" = EXCLUDED."nav"
    `;
  }
  return withDates.length;
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

  const catalogUpserted = await bulkUpsertSchemeCatalog(records);
  const schemeMasterUpdated = await bulkUpdateSchemeMaster(records);
  const navSnapshotsUpserted = await bulkUpsertNavSnapshots(records);

  return {
    totalSchemesInFile: records.length,
    catalogUpserted,
    schemeMasterUpdated,
    navSnapshotsUpserted,
  };
}
