/**
 * Backfill for the NavSnapshot table.
 *
 * computeReturnsFromSnapshots() (src/lib/nav-snapshots.ts) can only produce a
 * return for a window it has a snapshot near, and NavSnapshot only starts
 * accumulating from whenever the sync-nav cron first runs — the normal sync
 * path has no historical backfill. So after a fresh deploy, Top Funds and every
 * local-return calculation for non-curated schemes sit blank for weeks.
 *
 * This script pulls full NAV history from mfapi.in for the schemes that
 * actually need local history — everything users hold, every row already in
 * SchemeMaster, and every curated benchmark — and bulk-upserts it into
 * NavSnapshot so those calculations work immediately.
 *
 * Safe to re-run: writes are ON CONFLICT ("schemeCode", "date") DO UPDATE.
 * Does NOT touch SchemeMaster.latestNav — that's the daily sync's job.
 *
 * Usage:
 *   npx tsx prisma/backfill-nav-snapshots.ts                          # dry run
 *   npx tsx prisma/backfill-nav-snapshots.ts --apply                  # write full history
 *   npx tsx prisma/backfill-nav-snapshots.ts --apply --days=1825      # cap at ~5y
 *   npx tsx prisma/backfill-nav-snapshots.ts --apply --codes=118989,120586
 *   npx tsx prisma/backfill-nav-snapshots.ts --apply --concurrency=4
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { BENCHMARK_SCHEMES } from '../src/lib/funds';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');
const argVal = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const MAX_DAYS = argVal('days') ? Number(argVal('days')) : Infinity;
const ONLY_CODES = argVal('codes')?.split(',').map((c) => c.trim()).filter(Boolean);
const CONCURRENCY = Math.max(1, argVal('concurrency') ? Number(argVal('concurrency')) : 5);

const SQL_CHUNK_SIZE = 2000;
const MFAPI_TIMEOUT_MS = 15000;
const DAY_MS = 24 * 60 * 60 * 1000;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** mfapi.in publishes dates as "DD-MM-YYYY". */
function parseMfapiDate(s: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

interface NavRow {
  schemeCode: string;
  nav: number;
  date: Date;
}

async function fetchHistory(schemeCode: string): Promise<NavRow[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MFAPI_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`mfapi.in returned ${res.status}`);
    const json = (await res.json()) as { data?: Array<{ date: string; nav: string }> };

    const cutoff = MAX_DAYS === Infinity ? 0 : Date.now() - MAX_DAYS * DAY_MS;
    const rows: NavRow[] = [];
    for (const entry of json.data ?? []) {
      const date = parseMfapiDate(entry.date);
      const nav = parseFloat(entry.nav);
      if (!date || !Number.isFinite(nav) || nav <= 0) continue;
      if (date.getTime() < cutoff) continue;
      rows.push({ schemeCode, nav, date });
    }
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

async function bulkUpsert(rows: NavRow[]): Promise<void> {
  for (const batch of chunk(rows, SQL_CHUNK_SIZE)) {
    const ids = batch.map(() => randomUUID());
    const codes = batch.map((r) => r.schemeCode);
    const navs = batch.map((r) => r.nav.toString());
    const dates = batch.map((r) => r.date.toISOString().slice(0, 10));

    await prisma.$executeRaw`
      INSERT INTO "NavSnapshot" ("id", "schemeCode", "nav", "date")
      SELECT id, code, nav::decimal, d::date
      FROM unnest(${ids}::text[], ${codes}::text[], ${navs}::text[], ${dates}::text[])
        AS t(id, code, nav, d)
      ON CONFLICT ("schemeCode", "date") DO UPDATE SET "nav" = EXCLUDED."nav"
    `;
  }
}

async function targetCodes(): Promise<string[]> {
  if (ONLY_CODES?.length) return [...new Set(ONLY_CODES)];

  const [holdings, masters] = await Promise.all([
    prisma.holding.findMany({ select: { schemeCode: true }, distinct: ['schemeCode'] }),
    prisma.schemeMaster.findMany({ select: { schemeCode: true } }),
  ]);

  const set = new Set<string>();
  for (const h of holdings) if (h.schemeCode) set.add(h.schemeCode);
  for (const m of masters) set.add(m.schemeCode);
  for (const b of BENCHMARK_SCHEMES) set.add(b.schemeCode);
  return [...set];
}

async function main() {
  console.log(APPLY ? 'APPLY mode — writing to NavSnapshot.' : 'DRY RUN — pass --apply to write.');

  const codes = await targetCodes();
  console.log(
    `Backfilling ${codes.length} scheme(s)` +
      (MAX_DAYS === Infinity ? ', full history' : `, last ${MAX_DAYS} days`) +
      `, concurrency ${CONCURRENCY}.\n`
  );

  let ok = 0;
  let failed = 0;
  let rowsSeen = 0;
  let rowsWritten = 0;
  const failures: string[] = [];

  for (const group of chunk(codes, CONCURRENCY)) {
    await Promise.all(
      group.map(async (code) => {
        try {
          const rows = await fetchHistory(code);
          rowsSeen += rows.length;
          if (APPLY && rows.length) {
            await bulkUpsert(rows);
            rowsWritten += rows.length;
          }
          ok++;
          process.stdout.write(`  ${code}: ${rows.length} rows${APPLY ? ' upserted' : ''}\n`);
        } catch (e) {
          failed++;
          failures.push(code);
          process.stdout.write(`  ${code}: FAILED — ${(e as Error).message}\n`);
        }
      })
    );
    await new Promise((r) => setTimeout(r, 300)); // be gentle with mfapi.in
  }

  console.log(
    `\n${APPLY ? 'Done.' : 'Dry run complete.'} ` +
      `${ok} scheme(s) fetched, ${failed} failed, ${rowsSeen} NAV rows seen` +
      (APPLY ? `, ${rowsWritten} upserted.` : '.')
  );
  if (failures.length) console.log(`Failed codes: ${failures.join(', ')}`);
  if (!APPLY) console.log('\nRe-run with --apply to write.');
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
