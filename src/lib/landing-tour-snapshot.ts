/**
 * Frozen landing-tour snapshot shaped like the prisma seed portfolio
 * (test@foliovega.com holdings + SchemeMaster). Public pages never hit the DB.
 * Figures are illustrative for marketing UI only.
 */

export const LANDING_TOUR_DISCLAIMER =
  "Illustrative sample portfolio — not live account data. Past performance is not indicative of future results.";

export const LANDING_TOUR_SNAPSHOT = {
  portfolioValue: 52_840,
  invested: 42_000,
  xirr: 14.2,
  healthScore: 72,
  holdings: [
    { name: "Franklin India Large Cap Fund", category: "Large Cap", value: 11_250, riskLevel: "Moderate" },
    { name: "HDFC Mid-Cap Opportunities Fund", category: "Mid Cap", value: 6_820, riskLevel: "High" },
    { name: "SBI Small Cap Fund", category: "Small Cap", value: 5_410, riskLevel: "Very High" },
    { name: "DSP Flexi Cap Fund", category: "Flexi Cap", value: 5_780, riskLevel: "Moderate to High" },
    { name: "Mirae Asset Large Cap Fund", category: "Large Cap", value: 4_960, riskLevel: "Moderate" },
    { name: "Axis Bluechip Fund", category: "Large Cap", value: 5_120, riskLevel: "Moderate" },
    { name: "ICICI Prudential Value Discovery Fund", category: "Flexi Cap", value: 8_140, riskLevel: "Moderate to High" },
    { name: "Kotak Emerging Equity Fund", category: "Mid Cap", value: 5_360, riskLevel: "High" },
  ],
  allocation: [
    { label: "Large Cap", weight: 40, color: "#14b8a6" },
    { label: "Flexi Cap", weight: 26, color: "#2dd4bf" },
    { label: "Mid Cap", weight: 23, color: "#f59e0b" },
    { label: "Small Cap", weight: 11, color: "#f97316" },
  ],
  overlap: {
    pairs: [
      { a: "Franklin Large Cap", b: "Mirae Large Cap", overlapPct: 28 },
      { a: "HDFC Mid Cap", b: "Kotak Emerging", overlapPct: 19 },
    ],
    topStock: { name: "HDFC Bank", combinedPct: 7.2 },
  },
  riskRows: [
    { label: "SBI Small Cap Fund", level: "Very High", w: 88 },
    { label: "HDFC Mid-Cap Opportunities", level: "High", w: 72 },
    { label: "DSP Flexi Cap Fund", level: "Moderate to High", w: 55 },
    { label: "Franklin India Large Cap", level: "Moderate", w: 42 },
  ],
  compare: {
    funds: [
      { name: "HDFC Mid-Cap Opportunities", xirr: 22.3, category: "Mid Cap" },
      { name: "Kotak Emerging Equity", xirr: 20.1, category: "Mid Cap" },
      { name: "SBI Small Cap Fund", xirr: 18.5, category: "Small Cap" },
    ],
  },
  sip: {
    monthly: 10_000,
    years: 15,
    assumedReturnPct: 12,
    futureValue: 50_45_760,
  },
  report: {
    funds: 8,
    categories: 4,
    gain: 10_840,
  },
} as const;
