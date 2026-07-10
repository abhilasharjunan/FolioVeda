import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BENCHMARK_SCHEMES } from "@/lib/funds";

export const dynamic = 'force-dynamic';

/**
 * Previously this route computed full risk metrics (Sharpe/Sortino/beta/alpha/
 * drawdown/composite score) LIVE, per request, for every one of the ~90 curated
 * schemes — hitting external APIs up to 3x per scheme with only light batching.
 * That's the most likely cause of "risk analysis is not working properly"
 * (see FolioVeda_Audit_and_Roadmap.md, section 1.4).
 *
 * The fix: read the same fields straight off SchemeMaster, which the weekly
 * `sync-risk` cron (src/lib/risk-sync.ts) already computes and persists — the
 * same pattern already used by /api/funds/top-performing and /api/funds/batch.
 * The expensive computation now only ever runs inside the cron, off the
 * user-facing request path.
 */
export async function GET() {
  try {
    const schemeCodes = BENCHMARK_SCHEMES.map((s) => s.schemeCode);

    const schemes = await prisma.schemeMaster.findMany({
      where: { schemeCode: { in: schemeCodes } },
      select: {
        schemeCode: true,
        schemeName: true,
        category: true,
        volatility: true,
        sharpeRatio: true,
        sortinoRatio: true,
        maxDrawdown: true,
        maxDrawdownDuration: true,
        alpha: true,
        beta: true,
        rSquared: true,
        treynorRatio: true,
        riskScore: true,
        concentrationRisk: true,
        sectorConcentration: true,
        fundManagerName: true,
        fundManagerTenure: true,
      },
    });

    if (schemes.length === 0) {
      return NextResponse.json(
        { error: "Risk metrics cache is empty. Run the weekly sync-risk cron or re-seed the database." },
        { status: 503 }
      );
    }

    const results: Record<string, any[]> = {};

    for (const s of schemes) {
      // Some schemes may not have been risk-synced yet (riskScore null) — skip
      // rather than show misleading zeroed-out metrics.
      if (s.riskScore == null || s.sharpeRatio == null) continue;

      const cat = s.category || "Other";
      if (!results[cat]) results[cat] = [];

      results[cat].push({
        schemeCode: s.schemeCode,
        schemeName: s.schemeName,
        category: cat,
        metrics: {
          volatility: Number(s.volatility || 0),
          sharpeRatio: Number(s.sharpeRatio || 0),
          sortinoRatio: Number(s.sortinoRatio || 0),
          maxDrawdown: Number(s.maxDrawdown || 0),
          maxDrawdownDuration: s.maxDrawdownDuration || 0,
          alpha: Number(s.alpha || 0),
          beta: Number(s.beta || 0),
          rSquared: Number(s.rSquared || 0),
          treynorRatio: Number(s.treynorRatio || 0),
          concentrationRisk: Number(s.concentrationRisk || 0),
          sectorConcentration: Number(s.sectorConcentration || 0),
          compositeScore: Number(s.riskScore || 0),
        },
        fundManagerName: s.fundManagerName,
        fundManagerTenure: s.fundManagerTenure,
      });
    }

    for (const cat in results) {
      results[cat].sort((a, b) => b.metrics.compositeScore - a.metrics.compositeScore);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Risk Analysis API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
