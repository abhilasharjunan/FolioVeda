import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculatePortfolioOverlapMatrix } from "@/lib/overlap";

export const dynamic = 'force-dynamic';

// GET /api/portfolio/overlap
// Pairwise weighted overlap across every fund in the logged-in user's portfolio —
// powers a portfolio-wide overlap heatmap (audit report, Phase 4 item 9).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
      include: { holdings: { select: { schemeCode: true } } },
    });

    if (!portfolio || portfolio.holdings.length < 2) {
      return NextResponse.json({ funds: [], pairs: [] });
    }

    const schemeCodes = [...new Set(portfolio.holdings.map((h) => h.schemeCode))];

    // Return the full fund list too (not just pairs with overlap data), so the
    // UI can render a complete grid even for funds whose holdings data isn't
    // available (shown as "N/A" rather than silently omitted).
    const schemes = await prisma.schemeMaster.findMany({
      where: { schemeCode: { in: schemeCodes } },
      select: { schemeCode: true, schemeName: true, category: true },
    });
    const funds = schemeCodes.map((code) => {
      const s = schemes.find((x) => x.schemeCode === code);
      return { schemeCode: code, schemeName: s?.schemeName || `Scheme ${code}`, category: s?.category || null };
    });

    const pairs = await calculatePortfolioOverlapMatrix(schemeCodes);

    return NextResponse.json({ funds, pairs });
  } catch (error) {
    console.error("Portfolio overlap API error:", error);
    return NextResponse.json({ error: "Failed to calculate portfolio overlap" }, { status: 500 });
  }
}
