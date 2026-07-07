import { prisma } from "@/lib/prisma";
import { BENCHMARK_SCHEMES, FundCategory, calculateCAGR, getHistoricalNav } from "@/lib/funds";

const CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap",
  "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
];

export async function syncTopFundsCache() {
  const results: Record<string, any[]> = {};

  for (const cat of CATEGORIES) {
    const schemes = BENCHMARK_SCHEMES.filter(s => s.category === cat);
    const fundData: any[] = [];

    for (let i = 0; i < schemes.length; i += 3) {
      const batch = schemes.slice(i, i + 3);
      const batchResults = await Promise.all(batch.map(async (scheme) => {
        try {
          const currentNav = await getHistoricalNav(scheme.schemeCode, 0);
          if (!currentNav) return null;

          const windows: Record<string, number> = {
            "1M": 30, "3M": 90, "6M": 180,
            "1Y": 365, "3Y": 3 * 365, "5Y": 5 * 365, "10Y": 10 * 365,
          };

          const returns: Record<string, number | null> = {};
          let oldestNav = currentNav;

          for (const [label, days] of Object.entries(windows)) {
            const pastNav = await getHistoricalNav(scheme.schemeCode, days);
            returns[label] = pastNav ? calculateCAGR(currentNav, pastNav, days) : null;
            if (pastNav && pastNav < oldestNav) oldestNav = pastNav;
          }

          const inceptionCagr = calculateCAGR(currentNav, oldestNav, 365 * 10);

          return {
            schemeCode: scheme.schemeCode,
            schemeName: scheme.schemeName,
            fundHouse: "Mutual Fund",
            nav: currentNav,
            returns,
            sinceInception: inceptionCagr,
          };
        } catch (e) {
          console.error(`Error fetching ${scheme.schemeCode}:`, e);
          return null;
        }
      }));

      fundData.push(...batchResults.filter(Boolean));
      await new Promise(r => setTimeout(r, 200));
    }

    const sorted = fundData
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => (b.returns["3Y"] || 0) - (a.returns["3Y"] || 0))
      .slice(0, 10);

    results[cat] = sorted;
  }

  await prisma.topFundsCache.deleteMany();

  for (const [category, funds] of Object.entries(results)) {
    const records = funds.map((fund, idx) => ({
      category,
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
      fundHouse: fund.fundHouse,
      nav: fund.nav,
      returns: fund.returns,
      sinceInception: fund.sinceInception,
      rank: idx + 1,
    }));

    for (const record of records) {
      await prisma.topFundsCache.create({ data: record });
    }
  }

  return results;
}
