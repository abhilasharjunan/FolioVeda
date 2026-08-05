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

## Cron Jobs (Vercel)
Configured in `vercel.json`:
- NAV / scheme sync
- Risk metrics sync
- Top-funds sync

Manual trigger example:
`GET /api/cron/sync-nav` with `Authorization: Bearer $CRON_SECRET`
