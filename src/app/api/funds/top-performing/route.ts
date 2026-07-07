import { NextResponse } from "next/server";
import { syncTopFundsCache } from "@/lib/sync-top-funds";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = await prisma.topFundsCache.findMany({
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
    });

    if (cached.length > 0) {
      const results: Record<string, any[]> = {};
      for (const entry of cached) {
        if (!results[entry.category]) results[entry.category] = [];
        results[entry.category].push({
          schemeCode: entry.schemeCode,
          schemeName: entry.schemeName,
          fundHouse: entry.fundHouse,
          nav: Number(entry.nav),
          returns: entry.returns as Record<string, number | null>,
          sinceInception: entry.sinceInception ? Number(entry.sinceInception) : null,
          rank: entry.rank,
        });
      }
      return NextResponse.json(results);
    }

    const results = await syncTopFundsCache();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Top Performing Funds API Error:", error);
    return NextResponse.json({ error: "Failed to fetch top funds" }, { status: 500 });
  }
}
