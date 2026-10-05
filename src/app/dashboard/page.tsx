import { getPortfolioAnalysis } from "@/lib/analysis";
import { getPortfolioDiversification } from "@/lib/diversification";
import { getPortfolioRiskAnalysis } from "@/lib/portfolio-risk";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { FirstRunGuide } from "@/components/onboarding/FirstRunGuide";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const [analysis, divScore, riskAnalysis] = await Promise.all([
    getPortfolioAnalysis(),
    getPortfolioDiversification(),
    getPortfolioRiskAnalysis(),
  ]);

  if (!analysis) {
    return <FirstRunGuide showWelcome={welcome === "1"} />;
  }

  return (
    <DashboardClient
      analysis={analysis}
      divScore={divScore}
      riskAnalysis={riskAnalysis}
    />
  );
}
