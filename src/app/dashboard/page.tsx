import { getPortfolioAnalysis } from "@/lib/analysis";
import { getPortfolioDiversification } from "@/lib/diversification";
import { getPortfolioRiskAnalysis } from "@/lib/portfolio-risk";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [analysis, divScore, riskAnalysis] = await Promise.all([
    getPortfolioAnalysis(),
    getPortfolioDiversification(),
    getPortfolioRiskAnalysis(),
  ]);

  if (!analysis) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="text-5xl">📊</div>
          <h2 className="text-2xl font-bold text-slate-900">No Portfolio Yet</h2>
          <p className="text-slate-500">Add your first mutual fund holding to see your portfolio analysis, XIRR tracking, and diversification insights.</p>
          <a
            href="/portfolio"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all"
          >
            Add Your First Holding
          </a>
        </div>
      </div>
    );
  }

  return <DashboardClient analysis={analysis} divScore={divScore} riskAnalysis={riskAnalysis} />;
}
