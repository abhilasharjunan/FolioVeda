import { LANDING_TOUR_SNAPSHOT } from "@/lib/landing-tour-snapshot";

export type LandingFeatureSceneId =
  | "dashboard"
  | "holdings"
  | "overlap"
  | "risk"
  | "diversify"
  | "compare"
  | "sip"
  | "report";

export interface LandingFeatureScene {
  id: LandingFeatureSceneId;
  title: string;
  headline: string;
  /** Short outcome-focused line under the mock UI */
  tagline: string;
}

export const LANDING_FEATURE_SCENES: LandingFeatureScene[] = [
  {
    id: "dashboard",
    title: "Portfolio dashboard",
    headline: "See what your funds are actually doing",
    tagline: "True cash-flow XIRR, live value, and a health score — not vanity CAGR.",
  },
  {
    id: "holdings",
    title: "Holdings & import",
    headline: "Add funds or import CSV",
    tagline: "Track units and transactions across your schemes in one place.",
  },
  {
    id: "overlap",
    title: "Look-through overlap",
    headline: "Hidden duplication across funds",
    tagline: "Stock and sector concentration across schemes you thought were diversified.",
  },
  {
    id: "risk",
    title: "Risk X-Ray",
    headline: "SEBI-aware risk context",
    tagline: "Fund-level risk views aligned with how Indian investors read labels.",
  },
  {
    id: "diversify",
    title: "Diversification",
    headline: "Category mix at a glance",
    tagline: "See whether you are over-tilted to one style or cap bucket.",
  },
  {
    id: "compare",
    title: "Compare & top funds",
    headline: "Side-by-side fund decisions",
    tagline: "Benchmark peers in your category before you add the next SIP.",
  },
  {
    id: "sip",
    title: "SIP & planning",
    headline: "Forward projections for goals",
    tagline: "Model monthly SIPs, step-ups, and scenarios — planning, not a promise.",
  },
  {
    id: "report",
    title: "Portfolio report",
    headline: "Shareable snapshot",
    tagline: "Print or export a clean summary for your own records or advisor.",
  },
];

/** @deprecated Use LANDING_TOUR_SNAPSHOT — kept for any residual imports */
export const LANDING_MOCK_DASHBOARD = {
  portfolioValue: LANDING_TOUR_SNAPSHOT.portfolioValue,
  invested: LANDING_TOUR_SNAPSHOT.invested,
  xirr: LANDING_TOUR_SNAPSHOT.xirr,
  healthScore: LANDING_TOUR_SNAPSHOT.healthScore,
};

export const LANDING_MOCK_OVERLAP = LANDING_TOUR_SNAPSHOT.overlap;

export const LANDING_MOCK_COMPARE = LANDING_TOUR_SNAPSHOT.compare;
