import { NextRequest, NextResponse } from "next/server";
import { BENCHMARK_SCHEMES, FundCategory } from "@/lib/funds";
import { getFullRiskAnalysis } from "@/lib/risk-analysis";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {

  try {
    const results: Record<string, any[]> = {};
    const categories: FundCategory[] = [
      "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
    ];

    for (const cat of categories) {
      const schemes = BENCHMARK_SCHEMES.filter(s => s.category === cat);
      const riskData: any[] = [];

      for (let i = 0; i < schemes.length; i += 3) {
        const batch = schemes.slice(i, i + 3);
        const batchResults = await Promise.all(batch.map(async (scheme) => {
          try {
            const analysis = await getFullRiskAnalysis(scheme.schemeCode);
            if (!analysis) return null;

            return {
              schemeCode: analysis.schemeCode,
              schemeName: analysis.schemeName,
              category: scheme.category,
              metrics: analysis.metrics,
              fundManagerName: analysis.fundManagerName,
              fundManagerTenure: analysis.fundManagerTenure,
            };
          } catch (e) {
            console.error(`Risk API error for ${scheme.schemeCode}:`, e);
            return null;
          }
        }));
        riskData.push(...batchResults);
        await new Promise(r => setTimeout(r, 200));
      }

      results[cat] = (riskData.filter((f): f is NonNullable<typeof f> => f !== null) as any[])
        .sort((a, b) => b.metrics.compositeScore - a.metrics.compositeScore);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Risk Analysis API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
