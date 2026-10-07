---
name: FolioVeda
description: SEBI-aware mutual fund portfolio analyzer for Indian Direct Growth DIY investors
colors:
  primary: "hsl(173 80% 36%)"
  primary-dark: "hsl(172 66% 50%)"
  primary-foreground: "hsl(166 76% 97%)"
  accent: "hsl(160 84% 39%)"
  background: "hsl(210 20% 96%)"
  background-dark: "hsl(222 47% 7%)"
  foreground: "hsl(222 47% 11%)"
  foreground-dark: "hsl(210 40% 98%)"
  surface: "hsl(0 0% 100%)"
  surface-dark: "hsl(222 47% 11%)"
  muted: "hsl(214 20% 92%)"
  muted-foreground: "hsl(215 16% 40%)"
  border: "hsl(214 20% 88%)"
  success: "hsl(160 84% 39%)"
  danger: "hsl(0 72% 51%)"
  warning: "hsl(38 92% 50%)"
  nav-bg: "hsl(210 20% 98% / 0.9)"
typography:
  display:
    fontFamily: "var(--font-heading), Outfit, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "var(--font-heading), Outfit, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-sans), Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1rem"
spacing:
  page: "1.5rem"
  section: "2rem"
  card: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "hsl(173 80% 32%)"
  surface-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
---

# FolioVeda Design System

## Overview

FolioVeda is a calm, numerate **portfolio truth layer** for Indian DIY Direct Growth investors. The visual language is soft-graphite fintech: deep slate surfaces, teal brand accents that match the Folio**Veda** wordmark, emerald for healthy growth, and amber/rose only for risk status. Operate-mode UI (dashboard, holdings, overlap, tools) prioritizes scanability over marketing theater. Persuade-mode (landing) may be denser but still shares the same teal/slate tokens.

## Colors

- **Brand / primary:** Teal (`--primary`, `--ring`) — CTAs, active nav, hero gradients, focus rings. Aligns with the teal wordmark; do not reintroduce indigo/violet as brand chrome.
- **Accent / success:** Emerald (`--accent`, `--success`) — positive returns, healthy scores.
- **Neutrals:** Slate scale via `--background`, `--foreground`, `--muted`, `--border`, `--surface`, `--nav-bg`.
- **Status:** Amber warning, rose/danger for errors and concentration — pair tinted backgrounds with **hue-matched** text (never gray-on-color).
- **Themes:** Class-based light/dark via `next-themes`; both defined in `src/app/globals.css`.

## Typography

- **Sans (UI body):** Plus Jakarta Sans → `--font-sans`
- **Heading / display:** Outfit → `--font-heading` with slight negative tracking (`.font-heading`)
- Prefer tabular nums for money, XIRR, and weights
- Progressive disclosure: plain-language verdict first, dense ratios second

## Layout

- App shell: sticky nav (`h-14`), flex column `page-shell` with soft radial page gradient, SEBI footer
- Content width commonly `max-w-5xl`–`max-w-7xl` with `px-4 py-6 sm:p-6`
- Dense data tables may scroll horizontally inside `.table-scroll` wrappers (edge fade cue)
- Touch targets for primary chrome ≈ 40–44px (`h-10` / `size-10`)

## Elevation & Depth

- `.surface-card`: 1px border from `--border`, soft 1–3px offset shadow (stronger in dark)
- Prefer real separation over decorative glow; no neon indigo glows
- Avoid thick colored left borders (`border-l-4`) on cards — use type, spacing, or soft tint

## Shapes

- Default radius `--radius: 0.75rem`; cards and controls use rounded-lg / rounded-xl
- Icon buttons are square rounded-lg at `size-10`

## Components

- **Button / Input:** Shared focus-visible ring using `--ring`; default height `h-10`
- **ThemeToggle:** Icon button with clear `aria-label`
- **FundDetailSheet:** Modal dialog with labelled title, Escape, focus trap, restore focus
- **PageLoader:** Teal spinner + `role="status"`; respects reduced motion
- **Planner tabs (SIP/SWP):** `tablist` / `tab` / `tabpanel` with `aria-controls`
- **Navbar:** Mobile drawer traps focus while open; Escape closes

## Do's and Don'ts

**Do**
- Lead with teal brand accents and portfolio-specific numbers
- Keep “not investment advice” / data-lag honesty visible in chrome
- Gate Framer motion with `useReducedMotion`; keep CSS reduced-motion targeted (no global `0.01ms` nuke)
- Associate every form label with its control (`htmlFor` / `id`)

**Don't**
- Use indigo/violet gradients or Inter as brand chrome
- Place gray slate text on tinted blue/rose chips
- Use thick `border-l-4` side-tabs on cards
- Promise returns in SIP/SWP copy — assumed projections only
