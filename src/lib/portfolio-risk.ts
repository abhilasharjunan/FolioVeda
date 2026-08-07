import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeHHI } from "@/lib/risk-calculations";
import { ensureSchemeNavs } from "@/lib/ensure-scheme-navs";

export async function getPortfolioRiskAnalysis() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { userId: session.user.id },
    include: {
      holdings: {
        include: { transactions: true },
      },
    },
  });

  if (!portfolio || portfolio.holdings.length === 0) return null;

  let totalValue = 0;
  const holdingRisks: Array<{
    schemeName: string;
    schemeCode: string;
    category: string | null;
    currentValue: number;
    volatility: number;
    riskScore: number;
    riskLevel: string;
  }> = [];
  const categoryAllocation: Record<string, number> = {};

  const schemeCodes = [...new Set(portfolio.holdings.map((h) => h.schemeCode))];
  const schemeMap = await ensureSchemeNavs(schemeCodes);

  // Also load risk metrics from SchemeMaster
  const riskRows = await prisma.schemeMaster.findMany({
    where: { schemeCode: { in: schemeCodes } },
    select: {
      schemeCode: true,
      volatility: true,
      riskScore: true,
      riskLevel: true,
    },
  });
  const riskMap = new Map(riskRows.map((s) => [s.schemeCode, s]));

  for (const holding of portfolio.holdings) {
    const scheme = schemeMap.get(holding.schemeCode);
    if (!scheme) continue;

    let currentValue = Number(holding.units) * Number(scheme.latestNav);
    if (currentValue <= 0) {
      currentValue = holding.transactions.reduce((sum, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "BUY" ? sum + amt : sum - amt;
      }, 0);
    }
    if (currentValue <= 0) continue;

    totalValue += currentValue;

    const category = scheme.category || 'Uncategorized';
    categoryAllocation[category] = (categoryAllocation[category] || 0) + currentValue;

    const risk = riskMap.get(holding.schemeCode);
    holdingRisks.push({
      schemeName: scheme.schemeName,
      schemeCode: holding.schemeCode,
      category: scheme.category,
      currentValue,
      volatility: Number(risk?.volatility || 0),
      riskScore: Number(risk?.riskScore || 0),
      riskLevel: risk?.riskLevel || 'Moderate',
    });
  }

  if (totalValue === 0 || holdingRisks.length === 0) return null;

  let weightedVol = 0;
  let weightedScore = 0;

  holdingRisks.forEach((h) => {
    const weight = h.currentValue / totalValue;
    weightedVol += h.volatility * weight;
    weightedScore += h.riskScore * weight;
  });

  const hhi = computeHHI(
    holdingRisks.map((h) => ({ allocation: h.currentValue / totalValue }))
  );

  const categories = Object.entries(categoryAllocation).map(([name, value]) => ({
    name,
    percentage: (value / totalValue) * 100,
    value,
  }));

  return {
    totalValue,
    weightedVol,
    weightedScore,
    hhi,
    categories,
    holdings: holdingRisks,
  };
}
