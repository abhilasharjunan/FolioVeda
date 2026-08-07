import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeHHI } from "@/lib/risk-calculations";
import { ensureSchemeNavs } from "@/lib/ensure-scheme-navs";

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
    include: { transactions: true },
  }) as Array<{ schemeCode: string; units: any; transactions: Array<{ type: string; amount: any }> }>;

  if (holdings.length === 0) return null;

  const schemeCodes = [...new Set(holdings.map((h) => h.schemeCode))];
  const schemeMap = await ensureSchemeNavs(schemeCodes);

  const categoryMap: Record<string, number> = {};
  let totalValue = 0;

  holdings.forEach((h) => {
    const scheme = schemeMap.get(h.schemeCode);
    const cat = scheme?.category || "Unknown";
    let value = Number(h.units) * Number(scheme?.latestNav || 0);
    if (value <= 0) {
      value = h.transactions.reduce((sum, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "BUY" ? sum + amt : sum - amt;
      }, 0);
    }
    categoryMap[cat] = (categoryMap[cat] || 0) + value;
    totalValue += value;
  });

  if (totalValue <= 0) return null;

  const distribution = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    percentage: (value / totalValue) * 100
  }));

  const hhi = computeHHI(distribution.map(d => ({ allocation: d.percentage / 100 })));
  const score = Math.round((1 - hhi) * 100);

  return {
    distribution,
    score,
    riskLevel: score >= 80 ? 'Well Diversified' : score > 60 ? 'Moderate Concentration' : 'High Concentration'
  };
}
