import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getFundInsights } from "@/lib/finapi";

export const dynamic = 'force-dynamic';

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
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!portfolio || portfolio.holdings.length === 0) {
      return NextResponse.json({ sectors: {}, totalValue: 0 });
    }

    const schemeCodes = [...new Set(portfolio.holdings.map(h => h.schemeCode))];

    const schemes = await prisma.schemeMaster.findMany({
      where: { schemeCode: { in: schemeCodes } },
      select: { schemeCode: true, latestNav: true, schemeName: true },
    });

    const navMap = new Map(schemes.map(s => [s.schemeCode, Number(s.latestNav) || 0]));

    const sectorValues: Record<string, number> = {};
    let totalValue = 0;

    const holdingValues = portfolio.holdings.map(h => {
      const nav = navMap.get(h.schemeCode) || 0;
      const invested = h.transactions.reduce((s, t) => s + (t.type === 'BUY' ? Number(t.amount) : -Number(t.amount)), 0);
      const currentValue = Number(h.units) * nav;
      totalValue += currentValue;
      return { schemeCode: h.schemeCode, currentValue, invested };
    });

    const finapiPromises = schemeCodes.map(async (code) => {
      try {
        const insights = await getFundInsights(code);
        // Prefer look-through from stock holdings; fall back to FinAPI sector map.
        const fromHoldings: Record<string, number> = {};
        for (const h of insights?.holdings || []) {
          const sector = (h.sector || "Other").trim() || "Other";
          fromHoldings[sector] = (fromHoldings[sector] || 0) + h.allocation;
        }
        const sectorAllocation =
          Object.keys(fromHoldings).length > 0
            ? fromHoldings
            : insights?.sectorAllocation || {};
        return { code, sectorAllocation };
      } catch {
        return { code, sectorAllocation: {} as Record<string, number> };
      }
    });

    const sectorResults = await Promise.all(finapiPromises);
    const sectorMap = new Map(sectorResults.map(r => [r.code, r.sectorAllocation]));

    for (const hv of holdingValues) {
      const sectors = sectorMap.get(hv.schemeCode) || {};
      for (const [sector, pct] of Object.entries(sectors)) {
        sectorValues[sector] = (sectorValues[sector] || 0) + (hv.currentValue * (pct / 100));
      }
    }

    const totalSectorValue = Object.values(sectorValues).reduce((s, v) => s + v, 0);
    const sectorPercentages: Record<string, number> = {};
    for (const [sector, value] of Object.entries(sectorValues)) {
      sectorPercentages[sector] = totalSectorValue > 0 ? parseFloat(((value / totalSectorValue) * 100).toFixed(1)) : 0;
    }

    const sorted = Object.entries(sectorPercentages)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {} as Record<string, number>);

    return NextResponse.json({
      sectors: sorted,
      totalValue,
      totalSectorValue: parseFloat(totalSectorValue.toFixed(2)),
    });
  } catch (error) {
    console.error("Portfolio sectors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
