---
name: FolioVeda
description: SEBI-aware mutual fund portfolio analyzer for Indian Direct Growth DIY investors
colors:
  primary: "hsl(173 80% 36%)"
  primary-hex: "#0d9488"
  primary-dark: "hsl(172 66% 50%)"
  primary-foreground: "hsl(166 76% 97%)"
  accent: "hsl(160 84% 39%)"
  accent-hex: "#10b981"
  background: "hsl(210 20% 96%)"
  background-dark: "hsl(222 47% 7%)"
  foreground: "hsl(222 47% 11%)"
  foreground-dark: "hsl(210 40% 98%)"
  surface: "hsl(0 0% 100%)"
  surface-dark: "hsl(222 47% 11%)"
  muted: "hsl(214 20% 92%)"
  muted-foreground: "hsl(215 16% 40%)"
  muted-foreground-hex: "#64748b"
  border: "hsl(214 20% 88%)"
  border-hex: "#e2e8f0"
  chart-grid: "#e2e8f0"
  success: "hsl(160 84% 39%)"
  danger: "hsl(0 72% 51%)"
  danger-hex: "#ef4444"
  warning: "hsl(38 92% 50%)"
  warning-hex: "#f59e0b"
  warning-strong-hex: "#f97316"
  nav-bg: "hsl(210 20% 98% / 0.9)"
  page-glow: "rgb(13 148 136 / 0.08)"
  page-glow-dark: "rgb(13 148 136 / 0.12)"
  shadow-dark: "rgb(0 0 0 / 0.35)"
  shadow-soft: "rgb(15 23 42 / 0.04)"
  chart-1: "#0d9488"
  chart-2: "#14b8a6"
  chart-3: "#10b981"
  chart-4: "#2dd4bf"
  chart-5: "#38bdf8"
  chart-6: "#f59e0b"
  chart-7: "#f97316"
  chart-8: "#ef4444"
  chart-9: "#64748b"
  chart-10: "#818cf8"
  chart-11: "#8b5cf6"
  chart-12: "#ec4899"
  chart-13: "#94a3b8"
  chart-14: "#0ea5e9"
  page-bg-start: "#f1f5f9"
  page-bg-mid: "#eef2f7"
  page-bg-dark: "#0f172a"
  page-bg-dark-mid: "#121826"
  page-glow-emerald: "rgb(16 185 129 / 0.06)"
  page-glow-emerald-dark: "rgb(16 185 129 / 0.08)"
  email-ink: "#1e3a5f"
  email-link: "#0d9488"
  email-muted: "#64748b"

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
  label:
    fontFamily: "var(--font-sans), Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "var(--font-sans), Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "var(--font-sans), Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.05em"
    lineHeight: 1.3
  badge:
    fontFamily: "var(--font-sans), Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.2

rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1rem"
  chart-tooltip: "0.5rem"
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

- **Sans (UI body):** Plus Jakarta Sans → `--font-sans` at `1rem` (`body`)
- **Heading / display:** Outfit → `--font-heading` with slight negative tracking (`.font-heading`)
- **Label:** `0.875rem` (`text-sm`) for form labels and secondary UI chrome
- **Caption (`meta-lg`):** `0.6875rem` / **11px** (`text-[11px]`) — dense secondary captions beside data (single-line or short helper next to a metric). Maps to Tailwind `text-[11px]`.
- **Meta / badge:** `0.625rem` / **10px** (`text-[10px]`) — uppercase tracking eyebrows, badge chips, mono scheme codes, table micro-labels. Maps to Tailwind `text-[10px]`.
- Prefer tabular nums for money, XIRR, and weights
- Progressive disclosure: plain-language verdict first, dense ratios second
- **Operate density:** 10–11px is intentional for non-body chrome only — never for multi-line paragraphs. Readable prose helpers use `text-xs` (`0.75rem`) or larger.


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
