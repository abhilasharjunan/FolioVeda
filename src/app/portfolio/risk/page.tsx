import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskOMeter } from '@/components/funds/RiskOMeter';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { getPortfolioRiskAnalysis } from '@/lib/portfolio-risk';
import { ShieldCheck, Activity, PieChart, AlertCircle, BarChart3, Download } from 'lucide-react';
import { FadeIn } from '@/components/animations';
import { MetricLabel, METRIC_EXPLANATIONS } from '@/components/ui/InfoTooltip';

export default async function PortfolioRiskPage() {
  const analysis = await getPortfolioRiskAnalysis();

  if (!analysis) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle size={48} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">No Portfolio Data</h2>
        <p className="text-slate-500 text-center max-w-md">
          We couldn't find any holdings in your portfolio to analyze. Please add some mutual funds first.
        </p>
      </div>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score < 20) return 'Low';
    if (score < 40) return 'Low to Moderate';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'Moderate to High';
    if (score < 90) return 'High';
    return 'Very High';
  };

  // Progressive disclosure: lead with a one-line, plain-language verdict before
  // the detailed ratios below (audit report, Phase 2 "progressive disclosure").
  const verdict = analysis.weightedScore < 40
    ? `Lower risk overall (${getRiskLevel(analysis.weightedScore)}), concentration index of ${analysis.hhi.toFixed(2)}.`
    : analysis.weightedScore < 70
    ? `Moderate risk overall, concentration index of ${analysis.hhi.toFixed(2)}.`
    : `Higher risk overall (${getRiskLevel(analysis.weightedScore)}) — consider reviewing concentration and volatility below.`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <FadeIn>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Portfolio Intelligence</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Risk Aggregation</h1>
            <p className="text-slate-500 max-w-2xl">
              Weighted analysis of your current portfolio's risk exposure and diversification.
            </p>
            <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 inline-block">
              {verdict}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/portfolio/export"
              download
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Export CSV
            </a>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Total Value</p>
              <p className="text-3xl font-bold text-slate-900">₹{analysis.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                <MetricLabel label="Aggregate Risk Score" tooltip={METRIC_EXPLANATIONS.compositeScore} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
              <RiskOMeter level={getRiskLevel(analysis.weightedScore)} />
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{analysis.weightedScore.toFixed(1)}</p>
                <p className="text-xs text-slate-400 uppercase font-medium">Weighted Score</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                <MetricLabel label="Portfolio Volatility" tooltip={METRIC_EXPLANATIONS.volatility} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                <Activity size={32} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{(analysis.weightedVol * 100).toFixed(2)}%</p>
                <p className="text-xs text-slate-400 uppercase font-medium">Annualized σ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                <MetricLabel label="Diversification (HHI)" tooltip={METRIC_EXPLANATIONS.hhi} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 py-6">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                <PieChart size={32} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{analysis.hhi.toFixed(4)}</p>
                <p className="text-xs text-slate-400 uppercase font-medium">Concentration Index</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {analysis.categories && analysis.categories.length > 0 && (
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-slate-400" />
                <CardTitle className="text-lg font-semibold">Category Allocation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <SectorPieChart 
                    data={Object.fromEntries(analysis.categories.map(c => [c.name.replace(/-/g, ' '), c.percentage]))} 
                  />
                </div>
                <div className="space-y-3">
                  {analysis.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cat.name.replace(/-/g, ' ')}</p>
                        <p className="text-xs text-slate-400">₹{cat.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{cat.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-semibold">Holdings Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fund</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Volatility</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-sider">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.holdings.map((h, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{h.schemeName}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{h.category}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600">
                        {((h.currentValue / analysis.totalValue) * 100).toFixed(2)}%
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-800 font-medium">
                        ₹{h.currentValue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600">
                        {(h.volatility * 100).toFixed(2)}%
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-slate-700 font-bold">
                          {h.riskScore.toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
