import { prisma } from "@/lib/prisma";
import { calculateXIRR } from "@/lib/xirr";
import { auth } from "@/auth";
import { cache } from 'react';

interface HoldingWithTransactions {
  schemeCode: string;
  units: any;
  transactions: Array<{
    type: string;
    amount: any;
    date: Date;
  }>;
}

interface PortfolioWithHoldings {
  holdings: HoldingWithTransactions[];
}

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

  if (!portfolio) return null;

  let totalInvested = 0;
  let currentMarketValue = 0;
  const overallCashFlows: { amount: number; date: Date }[] = [];

  // Single batched lookup instead of one findUnique() per holding (N+1 query fix
  // — see FolioVeda_Audit_and_Roadmap.md, section 1.5/3.6).
  const schemeCodes = [...new Set(portfolio.holdings.map((h: any) => h.schemeCode))];
  const schemes = await prisma.schemeMaster.findMany({
    where: { schemeCode: { in: schemeCodes as string[] } },
  });
  const schemeMap = new Map(schemes.map((s) => [s.schemeCode, s]));

  const holdingAnalysis = await Promise.all(
    portfolio.holdings.map(async (holding: any) => {
      const scheme = schemeMap.get(holding.schemeCode);

      const nav = scheme?.latestNav || 0;
      const currentVal = Number(holding.units) * Number(nav);
      
      const invested = holding.transactions.reduce((sum: number, tx: any) => 
        tx.type === "BUY" ? sum + Number(tx.amount) : sum - Number(tx.amount), 0
      );

      const fundCashFlows = holding.transactions.map((tx: any) => ({
        amount: tx.type === "BUY" ? -Number(tx.amount) : Number(tx.amount),
        date: tx.date,
      }));
      
      fundCashFlows.push({ amount: currentVal, date: new Date() });
      // null = could not converge / insufficient data — do NOT coerce to 0,
      // which is a legitimate return and would mislead the UI.
      const fundXirr = calculateXIRR(fundCashFlows);

      totalInvested += invested;
      currentMarketValue += currentVal;
      
      overallCashFlows.push(...holding.transactions.map((tx: any) => ({
        amount: tx.type === "BUY" ? -Number(tx.amount) : Number(tx.amount),
        date: tx.date,
      })));

      return {
        schemeName: scheme?.schemeName || "Unknown Fund",
        currentVal,
        invested,
        xirr: fundXirr != null ? fundXirr * 100 : null,
        gain: currentVal - invested,
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
