# FolioVeda — Mutual Fund Portfolio Analyzer

A SEBI-aware mutual fund portfolio tracker with XIRR returns, risk analytics, diversification scoring, and fund overlap analysis.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon, Supabase, or local)
- Optional: Redis for response caching

### Installation
1. Clone the repository and enter the app directory:
   ```bash
   cd folioveda
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
3. Initialize the database:
   ```bash
   npx prisma db push
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev` — local development server
- `npm run build` / `npm start` — production build & serve
- `npm test` — Vitest unit tests
- `npm run verify` — **mandatory gate**: production build + unit tests (run before commit/push)
- `npm run test:e2e` — Playwright e2e tests
- `npm run seed` — seed scheme data
- `npm run repair:holdings` — merge duplicate holdings before unique-constraint migrations

## Security
- **IDOR protection**: data access scoped to the authenticated user
- **Input validation**: Zod schemas on API inputs
- **CSV sanitization**: papaparse + Zod to block formula injection
- **Cron auth**: Bearer `CRON_SECRET` (with `?key=` fallback for manual runs)

## SEBI / Compliance Notes
- Persistent regulatory disclaimers in the footer and dashboard
- Standardized Risk-o-Meter for fund risk presentation
- Explicit consent flow for financial data storage
- Data attribution to AMFI / mfapi.in — informational only, not investment advice

## Tech Stack
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
- **Backend**: Next.js API routes, Prisma 7 + PostgreSQL
- **Auth**: NextAuth.js (credentials + Prisma adapter)
- **Cache**: Redis (`ioredis`) where configured
- **Calculations**: Newton-Raphson XIRR with bisection fallback; tested risk metrics
- **Data**: AMFI NAVAll for daily sync; mfapi.in for historical NAV; finapi for holdings/sectors

## Scheduled Jobs

Driven by GitHub Actions (`.github/workflows/scheduled-syncs.yml`), not Vercel
cron — the Hobby plan caps cron at ~2 jobs/day, which silently dropped most of
ours. The workflow curls the `/api/cron/*` routes; each authenticates with
`Authorization: Bearer $CRON_SECRET`. Add `CRON_SECRET` as a repo Actions secret.

- **NAV** (`sync-nav`, daily ~05:00 IST) — one AMFI `NAVAll.txt` fetch refreshes
  `SchemeMaster.latestNav`, upserts `SchemeCatalog`, and appends `NavSnapshot`
  history for the full universe.
- **Top funds** (`sync-top-funds?batch=0|1|2`, daily) — re-ranks the curated list
  (Direct Growth only) in three batches to stay under the function time limit.
- **Risk metrics** (`sync-risk`, weekly Mon).

Manual trigger: use **Run workflow** on the Actions tab, or curl directly:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://folioveda.vercel.app/api/cron/sync-nav"
```

### One-time NAV history backfill
`NavSnapshot` only accumulates from the first `sync-nav` run — no historical
backfill in the normal path. After a fresh deploy, seed it from mfapi.in:
```bash
npm run backfill:navs -- --apply          # full history for held + benchmark + tracked schemes
npm run backfill:navs -- --apply --days=1825   # or cap the depth
```
