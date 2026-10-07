import { prisma } from "@/lib/prisma";
import { calculateRiskMetrics } from "./risk-analysis";
import {
  BENCHMARK_SCHEMES,
  FUND_CATEGORIES,
  FundCategory,
  type BenchmarkScheme,
} from "./funds";

/** Accepts Prisma Decimal | number | null — we only null-check these fields. */
type SchemeRiskRow = {
  schemeCode: string;
  riskScore: unknown;
  sharpeRatio: unknown;
};

/** Benchmark schemes with no persisted risk metrics yet (new category rows, cron lag). */
export function benchmarkSchemesMissingRiskSync(rows: SchemeRiskRow[]): BenchmarkScheme[] {
  const byCode = new Map(rows.map((s) => [s.schemeCode, s]));
  return BENCHMARK_SCHEMES.filter((bs) => {
    const row = byCode.get(bs.schemeCode);
    return !row || row.riskScore == null || row.sharpeRatio == null;
  });
}

/** Categories that have curated benchmarks but no risk rows to show yet. */
export function riskCategoriesNeedingRefill(
  results: Record<string, unknown[]>
): FundCategory[] {
  return FUND_CATEGORIES.filter((cat) => {
    const benchmarkCount = BENCHMARK_SCHEMES.filter((s) => s.category === cat).length;
    if (benchmarkCount === 0) return false;
    return (results[cat]?.length ?? 0) === 0;
  });
}

async function persistRiskMetrics(scheme: BenchmarkScheme, metrics: NonNullable<Awaited<ReturnType<typeof calculateRiskMetrics>>>) {
  await prisma.schemeMaster.upsert({
    where: { schemeCode: scheme.schemeCode },
    update: {
      schemeName: scheme.schemeName,
      category: scheme.category,
      volatility: metrics.volatility,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      maxDrawdown: metrics.maxDrawdown,
      maxDrawdownDuration: metrics.maxDrawdownDuration,
      alpha: metrics.alpha,
      beta: metrics.beta,
      rSquared: metrics.rSquared,
      treynorRatio: metrics.treynorRatio,
      concentrationRisk: metrics.concentrationRisk,
      sectorConcentration: metrics.sectorConcentration,
      riskScore: metrics.compositeScore,
    },
    create: {
      schemeCode: scheme.schemeCode,
      schemeName: scheme.schemeName,
      category: scheme.category,
      latestNav: 0,
      volatility: metrics.volatility,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      maxDrawdown: metrics.maxDrawdown,
      maxDrawdownDuration: metrics.maxDrawdownDuration,
      alpha: metrics.alpha,
      beta: metrics.beta,
      rSquared: metrics.rSquared,
      treynorRatio: metrics.treynorRatio,
      concentrationRisk: metrics.concentrationRisk,
      sectorConcentration: metrics.sectorConcentration,
      riskScore: metrics.compositeScore,
    },
  });
}

export async function syncRiskMetricsForSchemes(schemes: BenchmarkScheme[]): Promise<number> {
  let updatedCount = 0;
  for (const scheme of schemes) {
    try {
      const metrics = await calculateRiskMetrics(scheme.schemeCode);
      if (metrics) {
        await persistRiskMetrics(scheme, metrics);
        updatedCount++;
      }
    } catch (error) {
      console.error(`Failed to sync risk for ${scheme.schemeCode}:`, error);
    }
  }
  return updatedCount;
}

export async function syncRiskMetrics() {
  console.log("Starting risk metrics synchronization...");
  const updatedCount = await syncRiskMetricsForSchemes(BENCHMARK_SCHEMES);
  console.log(`Risk synchronization complete. Updated ${updatedCount} schemes.`);
  return updatedCount;
}

