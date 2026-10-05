export type LandingFeatureSceneId =
  | "dashboard"
  | "overlap"
  | "risk"
  | "compare"
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
    id: "compare",
    title: "Compare & top funds",
    headline: "Side-by-side fund decisions",
    tagline: "Benchmark peers in your category before you add the next SIP.",
  },
  {
    id: "report",
    title: "Portfolio report",
    headline: "Shareable snapshot",
    tagline: "Print or export a clean summary for your own records or advisor.",
  },
];

/** Static mock metrics for landing visuals — illustrative only. */
export const LANDING_MOCK_DASHBOARD = {
  portfolioValue: 7_20_000,
  invested: 5_40_000,
  xirr: 12.6,
  healthScore: 78,
};

export const LANDING_MOCK_OVERLAP = {
  pairs: [
    { a: "Flexi Cap A", b: "Flexi Cap B", overlapPct: 34 },
    { a: "Large Cap", b: "Flexi Cap A", overlapPct: 22 },
  ],
  topStock: { name: "Reliance", combinedPct: 8.4 },
};

export const LANDING_MOCK_COMPARE = {
  funds: [
    { name: "Parag Parikh Flexi Cap", xirr: 14.2, category: "Flexi Cap" },
    { name: "HDFC Flexi Cap", xirr: 11.8, category: "Flexi Cap" },
  ],
};
