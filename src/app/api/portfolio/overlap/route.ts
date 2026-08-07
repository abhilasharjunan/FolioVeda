import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildPortfolioOverlapAnalysis, PortfolioFundWeight } from "@/lib/overlap";
import { ensureSchemeNavs } from "@/lib/ensure-scheme-navs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/portfolio/overlap
// Pairwise weighted MIN-overlap + look-through stock concentration.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
      include: {
        holdings: {
          select: { schemeCode: true, units: true },
        },
      },
    });

    if (!portfolio || portfolio.holdings.length < 2) {
      return NextResponse.json({
        funds: [],
        pairs: [],
        lookThrough: [],
        insightsAvailable: 0,
      });
    }

    const schemeCodes = [...new Set(portfolio.holdings.map((h) => h.schemeCode))];
    const schemeMap = await ensureSchemeNavs(schemeCodes);

    const schemes = await prisma.schemeMaster.findMany({
      where: { schemeCode: { in: schemeCodes } },
      select: { schemeCode: true, schemeName: true, category: true },
    });

    const valueByCode = new Map<string, number>();
    let totalValue = 0;
    for (const h of portfolio.holdings) {
      const nav = Number(schemeMap.get(h.schemeCode)?.latestNav || 0);
      const value = Number(h.units) * (nav > 0 ? nav : 0);
      const next = (valueByCode.get(h.schemeCode) || 0) + value;
      valueByCode.set(h.schemeCode, next);
      totalValue += value;
    }

    // If NAV missing entirely, fall back to equal weights so look-through still works.
    const useEqual = totalValue <= 0;
    const equalWeight = 100 / schemeCodes.length;

    const fundWeights: PortfolioFundWeight[] = schemeCodes.map((code) => {
      const s = schemes.find((x) => x.schemeCode === code);
      const name = s?.schemeName || schemeMap.get(code)?.schemeName || `Scheme ${code}`;
      const portfolioWeight = useEqual
        ? equalWeight
        : ((valueByCode.get(code) || 0) / totalValue) * 100;
      return { schemeCode: code, schemeName: name, portfolioWeight };
    });

    const funds = fundWeights.map((f) => {
      const s = schemes.find((x) => x.schemeCode === f.schemeCode);
      return {
        schemeCode: f.schemeCode,
        schemeName: f.schemeName,
        category: s?.category || null,
        portfolioWeight: f.portfolioWeight,
      };
    });

    const {
      pairs,
      lookThrough,
      sectors,
      sectorDiversification,
      concentratedTickers,
      insightsAvailable,
    } = await buildPortfolioOverlapAnalysis(fundWeights);

    return NextResponse.json({
      funds,
      pairs,
      lookThrough,
      sectors,
      sectorDiversification,
      concentratedTickers,
      insightsAvailable,
      totalFunds: funds.length,
    });
  } catch (error) {
    console.error("Portfolio overlap API error:", error);
    return NextResponse.json({ error: "Failed to calculate portfolio overlap" }, { status: 500 });
  }
}
