export type LandingPersonaId = "conservative" | "balanced" | "aggressive";

export interface LandingAllocation {
  label: string;
  weight: number; // 0-100
  color: string;
}

export interface LandingPersona {
  id: LandingPersonaId;
  name: string;
  blurb: string;
  portfolioValue: number;
  xirr: number;
  allocation: LandingAllocation[];
}

/** Static demo data for the public landing page — no API. */
export const LANDING_PERSONAS: LandingPersona[] = [
  {
    id: "conservative",
    name: "Conservative",
    blurb: "Debt-heavy mix for capital stability with modest equity upside.",
    portfolioValue: 4_85_000,
    xirr: 8.4,
    allocation: [
      { label: "Debt", weight: 55, color: "#64748b" },
      { label: "Large Cap", weight: 30, color: "#14b8a6" },
      { label: "Hybrid", weight: 15, color: "#38bdf8" },
    ],
  },
  {
    id: "balanced",
    name: "Balanced",
    blurb: "Core equity with hybrids — the default path for most salaried investors.",
    portfolioValue: 7_20_000,
    xirr: 12.6,
    allocation: [
      { label: "Flexi Cap", weight: 40, color: "#14b8a6" },
      { label: "Large Cap", weight: 25, color: "#2dd4bf" },
      { label: "Hybrid", weight: 20, color: "#38bdf8" },
      { label: "Debt", weight: 15, color: "#64748b" },
    ],
  },
  {
    id: "aggressive",
    name: "Aggressive",
    blurb: "Higher mid/small tilt for long horizons that can ride volatility.",
    portfolioValue: 9_15_000,
    xirr: 16.2,
    allocation: [
      { label: "Flexi Cap", weight: 35, color: "#14b8a6" },
      { label: "Mid Cap", weight: 30, color: "#f59e0b" },
      { label: "Small Cap", weight: 20, color: "#f97316" },
      { label: "International", weight: 15, color: "#818cf8" },
    ],
  },
];

export const LANDING_HERO_PREVIEW = LANDING_PERSONAS[1];
