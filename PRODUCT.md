# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a retail Indian mutual-fund investor who manages their own **Direct Growth** portfolio (salaried / DIY). They open FolioVeda to understand what they actually own, what they’ve actually earned, and whether their fund stack is concentrated or riskier than it looks — without waiting on an advisor or a brokerage app’s marketing surface.

Secondary audience (present in product, not primary): an **ADMIN** role for operational user/data management. Not the design north star for consumer surfaces.

## Product Purpose

FolioVeda is a SEBI-aware mutual fund **portfolio analyzer** for Indian investors. It helps DIY Direct Growth holders import or enter holdings, compute returns that respect cash-flow timing (XIRR), inspect look-through overlap and sector concentration across funds, review risk/diversification health, browse curated fund analytics, and run SIP/SWP planning scenarios.

Success means the investor can answer, with numbers they trust: *What am I holding through my funds? What did I earn given my real transactions? Where am I overexposed? What happens if I SIP or SWP under an assumed return?* — while clearly understanding the product is analytics only, not advice.

## Positioning

**Sharpened claim:** FolioVeda is the DIY Direct Growth investor’s **portfolio truth layer** — not a fund marketplace, not tips, not a brokerage.

A neighboring consumer app can show NAVs, rankings, or a single-fund factsheet. FolioVeda’s durable difference is reconstructing **cross-fund reality for a personal portfolio**: transaction-dated XIRR, look-through stock/sector overlap across the user’s actual holdings, and SEBI-aware risk presentation rolled into a portfolio-level health view — with SIP/SWP tools that stay explicitly “assumed returns, not promises.”

## Operating Context

- India mutual-fund Direct Growth plans; INR formatting and en-IN conventions in the product UI.
- Holdings enter via **manual entry** or **CSV / CAS-style import**; analysis depends on scheme codes, units, and NAV history.
- External market data: **AMFI** (daily NAVAll), **mfapi.in** (historical NAV), and holdings/sector insights providers used by sync jobs — data may lag; product must say so.
- Auth via NextAuth (credentials); password reset flows exist; consent for storing financial data is part of onboarding/account truth.
- Deployed as a Next.js web app (Vercel); scheduled syncs refresh NAV, top funds, and risk caches. Local development: `cd folioveda && npm run dev`.
- Core authenticated workflows: dashboard health → manage portfolio → overlap / risk / report → fund detail → SIP/SWP tools. Public surfaces: landing, academy, top funds, risk analysis browse, about, auth.

## Capabilities and Constraints

**Confirmed capabilities (product surface):**
- Portfolio CRUD: holdings list, manual add, CSV upload
- Dashboard with consolidated portfolio health (diversification + risk exposure)
- Portfolio overlap (pair overlap, look-through holdings/sectors)
- Portfolio risk analytics and printable/PDF-via-print report
- Fund detail sheet, fund compare, top funds, public risk-analysis browse
- SIP / SWP calculators and scenario tabs under planning tools
- Academy / educational content; account settings; admin area for privileged users
- Light/dark theme toggle; persistent regulatory footer

**Hard constraints:**
- **Analytics only** — not investment advice; mutual fund investments are subject to market risks
- **Consent** required for financial data storage; do not imply brokerage, execution, or advisory status
- **Data attribution** to AMFI / mfapi.in (and other disclosed sources); NAV/holdings may lag
- Focus remains **Indian Direct Growth** mutual funds unless the product owner expands scope
- App code lives under `folioveda/`; monorepo root may hold shared docs — product truth for the shipped app is this file

**Undecided (do not invent):**
- Commercial model (pricing, freemium, B2B advisor SKU)
- Formal accessibility conformance target (e.g. WCAG 2.2 AA) as a contractual bar
- Multi-language / regional localization beyond English UI with Indian number/date conventions
- Expansion beyond mutual funds (stocks, NPS, etc.)

## Brand Commitments

- Product name: **FolioVeda** (wordmark pattern in UI: Folio + accented “Veda”)
- Voice: clear, numerate, plain-language verdicts before dense ratios; progressive disclosure for risk math
- Personality: trustworthy DIY analyst — calm, specific, non-hype; never tip-selling or “guaranteed returns”
- Binding legal/compliance copy themes: not advice; market risk; data lag; © FolioVeda

## Evidence on Hand

- Runnable Next.js application in `folioveda/` (v1.9.x lineage in package.json)
- Landing demo personas and feature tour snapshots (static, not live customer data)
- SEBI-style footer and dashboard disclaimers in product chrome
- Unit/e2e test harness (Vitest, Playwright); contributor gate `npm run verify`
- Internal audit/roadmap doc at repo root (`FolioVeda_Audit_and_Roadmap.md`) — engineering history, not marketing claims
- **Do not fabricate:** customer testimonials, AUM figures, SEBI registration as an advisor/broker, performance guarantees, or third-party endorsements

## Product Principles

1. **Truth over theater** — Prefer correct, dated, portfolio-specific numbers over impressive but misleading aggregates.
2. **Look through the wrapper** — Funds are vehicles; show the stock/sector reality underneath when data exists.
3. **Plain verdict, then depth** — Lead with what it means; let ratios and tables be opt-in detail.
4. **Projections stay labeled** — SIP/SWP and assumed returns must never read as promises.
5. **Compliance is product** — Disclaimers, consent, and attribution are part of the experience, not fine print to hide.
