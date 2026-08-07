import { prisma } from "@/lib/prisma";
import { calculateXIRR } from "@/lib/xirr";
import { auth } from "@/auth";
import { cache } from 'react';
import { ensureSchemeNavs } from "@/lib/ensure-scheme-navs";

// Use React cache for request memoization within a single render pass
export const getPortfolioAnalysis = cache(async () => {
  // During build, return mock data to avoid Prisma initialization
  if (!process.env.DATABASE_URL) {
    return {
      totalInvested: 1000000,
      currentMarketValue: 1245000,
      absoluteGain: 245000,
      overallXirr: 15.4,
      holdings: [
        {
          schemeName: "HDFC Flexi Cap Fund - Direct",
          currentVal: 450000,
          invested: 400000,
          xirr: 18.5,
          gain: 50000,
        },
        {
          schemeName: "ICICI Prudential Bluechip Fund - Direct",
          currentVal: 380000,
          invested: 350000,
          xirr: 14.2,
          gain: 30000,
        },
        {
          schemeName: "SBI Small Cap Fund - Direct",
          currentVal: 290000,
          invested: 250000,
          xirr: 22.1,
          gain: 40000,
        },
        {
          schemeName: "Axis Long Term Equity Fund - Direct",
          currentVal: 125000,
          invested: 100000,
          xirr: 19.8,
          gain: 25000,
        },
      ],
    };
  }

  const session = await auth();
  if (!session?.user) return null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { userId: session.user.id },
    include: {
      holdings: {
        include: {
          transactions: { orderBy: { date: 'asc' } },
        },
      },
    },
  }) as any;

  if (!portfolio || portfolio.holdings.length === 0) return null;

  let totalInvested = 0;
  let currentMarketValue = 0;
  const overallCashFlows: { amount: number; date: Date }[] = [];

  const schemeCodes = [...new Set(portfolio.holdings.map((h: any) => h.schemeCode as string))] as string[];
  const schemeMap = await ensureSchemeNavs(schemeCodes);

  const holdingAnalysis = await Promise.all(
    portfolio.holdings.map(async (holding: any) => {
      const scheme = schemeMap.get(holding.schemeCode);

      const nav = scheme?.latestNav || 0;
      const currentVal = Number(holding.units) * Number(nav);

      const invested = holding.transactions.reduce((sum: number, tx: any) =>
        tx.type === "BUY" ? sum + Number(tx.amount) : sum - Number(tx.amount), 0
      );

      // If NAV still missing, show invested as current so the dashboard isn't blank zeros
      const effectiveCurrent = currentVal > 0 ? currentVal : invested;

      const fundCashFlows = holding.transactions.map((tx: any) => ({
        amount: tx.type === "BUY" ? -Number(tx.amount) : Number(tx.amount),
        date: tx.date,
      }));

      fundCashFlows.push({ amount: effectiveCurrent, date: new Date() });
      const fundXirr = calculateXIRR(fundCashFlows);

      totalInvested += invested;
      currentMarketValue += effectiveCurrent;

      overallCashFlows.push(...holding.transactions.map((tx: any) => ({
        amount: tx.type === "BUY" ? -Number(tx.amount) : Number(tx.amount),
        date: tx.date,
      })));

      return {
        schemeName: scheme?.schemeName || "Unknown Fund",
        currentVal: effectiveCurrent,
        invested,
        xirr: fundXirr != null ? fundXirr * 100 : null,
        gain: effectiveCurrent - invested,
      };
    })
  );

  overallCashFlows.push({ amount: currentMarketValue, date: new Date() });
  const overallXirr = calculateXIRR(overallCashFlows);

  return {
    totalInvested,
    currentMarketValue,
    absoluteGain: currentMarketValue - totalInvested,
    overallXirr: overallXirr != null ? overallXirr * 100 : null,
    holdings: holdingAnalysis,
  };
});
