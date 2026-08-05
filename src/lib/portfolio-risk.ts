import React from 'react';
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeHHI } from "@/lib/risk-calculations";

export async function getPortfolioRiskAnalysis() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      portfolios: {
        include: {
          holdings: {
            include: {
              transactions: true
            }
          }
        }
      }
    }
  });

  if (!user || user.portfolios.length === 0) return null;

  const portfolio = user.portfolios[0];
  let totalValue = 0;
  const holdingRisks: any[] = [];
  const categoryAllocation: Record<string, number> = {};

  // Single batched lookup instead of one findUnique() per holding (N+1 query fix
  // — see FolioVeda_Audit_and_Roadmap.md, section 1.5/3.6).
  const schemeCodes = [...new Set(portfolio.holdings.map((h) => h.schemeCode))];
  const schemes = await prisma.schemeMaster.findMany({
    where: { schemeCode: { in: schemeCodes } },
  });
  const schemeMap = new Map(schemes.map((s) => [s.schemeCode, s]));

  for (const holding of portfolio.holdings) {
    const scheme = schemeMap.get(holding.schemeCode);

    if (!scheme) continue;

    // Calculate current market value: (Total Units * Latest NAV)
    const currentValue = Number(holding.units) * Number(scheme.latestNav);
    totalValue += currentValue;

    const category = scheme.category || 'Uncategorized';
    categoryAllocation[category] = (categoryAllocation[category] || 0) + currentValue;

    holdingRisks.push({
      schemeName: scheme.schemeName,
      schemeCode: scheme.schemeCode,
      category: scheme.category,
      currentValue,
      volatility: Number(scheme.volatility || 0),
      riskScore: Number(scheme.riskScore || 0),
      riskLevel: scheme.riskLevel || 'Moderate'
    });
  }

  if (totalValue === 0) return null;

  // Weighted Averages
  let weightedVol = 0;
  let weightedScore = 0;

  holdingRisks.forEach(h => {
    const weight = h.currentValue / totalValue;
    weightedVol += h.volatility * weight;
    weightedScore += h.riskScore * weight;
  });

  // Diversification check (HHI based on value distribution) — same helper as
  // diversification.ts / risk-calculations so scores stay consistent.
  const hhi = computeHHI(
    holdingRisks.map((h) => ({ allocation: h.currentValue / totalValue }))
  );

  // Normalize category allocation to percentages
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
