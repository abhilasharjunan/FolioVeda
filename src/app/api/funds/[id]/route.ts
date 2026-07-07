import { NextRequest, NextResponse } from "next/server";
import { getFundInsights } from "@/lib/finapi";
import { getHistoricalNav, calculateCAGR } from "@/lib/funds";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Scheme ID is required" }, { status: 400 });
    }

    const [insights, scheme] = await Promise.all([
      getFundInsights(id),
      prisma.schemeMaster.findUnique({ where: { schemeCode: id } }),
    ]);

    if (!insights && !scheme) {
      return NextResponse.json({ error: "Fund insights not found" }, { status: 404 });
    }

    // Calculate CAGR returns for 1Y, 3Y, 5Y (non-fatal if fails)
    let cagrReturns: Record<string, number | null> = {};
    try {
      const currentNav = await getHistoricalNav(id, 0);
      const pastNav1Y = currentNav ? await getHistoricalNav(id, 365) : null;
      const pastNav3Y = currentNav ? await getHistoricalNav(id, 1095) : null;
      const pastNav5Y = currentNav ? await getHistoricalNav(id, 1825) : null;

      cagrReturns = {
        '1Y': currentNav && pastNav1Y ? calculateCAGR(currentNav, pastNav1Y, 365) : null,
        '3Y': currentNav && pastNav3Y ? calculateCAGR(currentNav, pastNav3Y, 1095) : null,
        '5Y': currentNav && pastNav5Y ? calculateCAGR(currentNav, pastNav5Y, 1825) : null,
      };
    } catch (cagrError) {
      console.warn(`CAGR calculation failed for ${id}:`, cagrError);
    }

    const riskLevelMappings: Record<string, string> = {
      'Low': 'Low',
      'Low to Moderate': 'Low to Moderate',
      'Moderate': 'Moderate',
      'Moderate to High': 'Moderate to High',
      'High': 'High',
      'Very High': 'Very High',
    };

    return NextResponse.json({
      ...insights,
      cagrReturns,
      schemeCode: scheme?.schemeCode || id,
      schemeName: scheme?.schemeName || insights?.schemeName || 'Unknown Fund',
      category: scheme?.category || null,
      fundHouse: scheme?.fundHouse || insights?.fundHouse || 'N/A',
      latestNav: scheme?.latestNav || null,
      lastUpdated: scheme?.lastUpdated || null,
      riskLevel: riskLevelMappings[scheme?.riskLevel || ''] || null,
      riskScore: scheme?.riskScore || null,
      volatility: scheme?.volatility || null,
      sharpeRatio: scheme?.sharpeRatio || null,
      sortinoRatio: scheme?.sortinoRatio || null,
      maxDrawdown: scheme?.maxDrawdown || null,
      maxDrawdownDuration: scheme?.maxDrawdownDuration || null,
      alpha: scheme?.alpha || null,
      beta: scheme?.beta || null,
      rSquared: scheme?.rSquared || null,
      treynorRatio: scheme?.treynorRatio || null,
      fundManagerName: scheme?.fundManagerName || insights?.fundManager?.name || null,
      fundManagerTenure: scheme?.fundManagerTenure || insights?.fundManager?.tenure || null,
    });
  } catch (error) {
    console.error("Fund Insights API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
