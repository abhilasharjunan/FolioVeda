import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeHHI } from "@/lib/risk-calculations";

interface Holding {
  schemeCode: string;
  units: any;
}

export async function getPortfolioDiversification() {
  // During build, return mock data to avoid Prisma initialization
  if (!process.env.DATABASE_URL) {
    return {
      distribution: [
        { name: 'Equity', percentage: 65.5 },
        { name: 'Debt', percentage: 25.2 },
        { name: 'Hybrid', percentage: 9.3 },
      ],
      score: 75,
      riskLevel: 'Moderate Concentration'
    };
  }

  const session = await auth();
  if (!session?.user) return null;

  const holdings = await prisma.holding.findMany({
    where: {
      portfolio: { userId: session.user.id }
    },
  }) as Array<{ schemeCode: string; units: any }>;

  if (holdings.length === 0) return null;

  // Fetch scheme details (including latestNav) for all unique scheme codes
  const schemeCodes = [...new Set(holdings.map((h: Holding) => h.schemeCode))];
  const schemes = await prisma.schemeMaster.findMany({
    where: {
      schemeCode: { in: schemeCodes }
    },
    select: { schemeCode: true, category: true, latestNav: true }
  });

  const schemeMap = new Map(schemes.map(s => [s.schemeCode, s]));

  // Weight allocation by current MARKET VALUE (units * NAV), not raw unit count.
  // Raw units badly distorts allocation for portfolios mixing funds with very
  // different NAVs (e.g. a ₹15 NAV debt fund vs. a ₹450 NAV equity fund) — see
  // FolioVeda_Audit_and_Roadmap.md, section 1.2/3.2.
  const categoryMap: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach((h: Holding) => {
    const scheme = schemeMap.get(h.schemeCode);
    const cat = scheme?.category || "Unknown";
    const value = Number(h.units) * Number(scheme?.latestNav || 0);
    categoryMap[cat] = (categoryMap[cat] || 0) + value;
    totalValue += value;
  });

  const distribution = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
  }));

  // Scoring: HHI (Herfindahl-Hirschman Index) of the category allocation, the
  // same measure used in portfolio-risk.ts, so there's one diversification
  // formula shared across the app instead of two disagreeing ones.
  // HHI ranges 0 (perfectly spread across many categories) to 1 (single category).
  const hhi = totalValue > 0
    ? computeHHI(distribution.map(d => ({ allocation: d.percentage / 100 })))
    : 1;
  const score = Math.round((1 - hhi) * 100);

  return {
    distribution,
    score,
    riskLevel: score >= 80 ? 'Well Diversified' : score > 60 ? 'Moderate Concentration' : 'High Concentration'
  };
}
