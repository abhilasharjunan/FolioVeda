import { getPortfolioAnalysis } from "@/lib/analysis";
import { getPortfolioDiversification } from "@/lib/diversification";
import { getPortfolioRiskAnalysis } from "@/lib/portfolio-risk";
import { PrintReportButton } from "@/components/portfolio/PrintReportButton";
import { TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default async function PortfolioReportPage() {
  const [analysis, divScore, riskAnalysis] = await Promise.all([
    getPortfolioAnalysis(),
    getPortfolioDiversification(),
    getPortfolioRiskAnalysis(),
  ]);

  if (!analysis) {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">No portfolio to report on yet</h2>
        <p className="text-slate-500">Add holdings first, then come back here to generate a report.</p>
      </div>
    );
  }

  const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  const healthScore =
    divScore?.score != null && riskAnalysis?.weightedScore != null
      ? Math.round((divScore.score + (100 - riskAnalysis.weightedScore)) / 2)
      : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Report</h1>
          <p className="text-slate-500 text-sm">Print-ready summary of your portfolio, diversification, and risk.</p>
        </div>
        <PrintReportButton />
      </div>

      {/* Report content — this is what gets printed */}
      <div className="space-y-6 print:break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <TrendingUp className="text-blue-600" size={22} />
            <span>Folio<span className="text-blue-600">Veda</span></span>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Generated {generatedAt}</p>
          </div>
        </div>

        <section className="print:break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Portfolio Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 border border-slate-200 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Current Value</p>
              <p className="text-lg font-bold text-slate-900">{fmtCurrency(analysis.currentMarketValue)}</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Invested</p>
              <p className="text-lg font-bold text-slate-900">{fmtCurrency(analysis.totalInvested)}</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Absolute Gain</p>
              <p className={`text-lg font-bold ${analysis.absoluteGain >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {fmtCurrency(analysis.absoluteGain)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Overall XIRR</p>
              <p className={`text-lg font-bold ${(analysis.overallXirr ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {analysis.overallXirr?.toFixed(2) ?? '0.00'}%
              </p>
            </div>
          </div>
        </section>

        {healthScore != null && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Portfolio Health</h2>
            <div className="flex items-center gap-6 p-4 border border-slate-200 rounded-lg">
              <div className="text-4xl font-bold text-slate-900">{healthScore}<span className="text-lg text-slate-400">/100</span></div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Diversification score: <strong>{divScore?.score}/100</strong> ({divScore?.riskLevel})</p>
                {riskAnalysis && <p>Risk exposure: <strong>{Math.round(riskAnalysis.weightedScore)}/100</strong></p>}
              </div>
            </div>
          </section>
        )}

        {divScore?.distribution && divScore.distribution.length > 0 && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Category Allocation</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {divScore.distribution.map((d: any) => (
                  <tr key={d.name} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{d.name}</td>
                    <td className="py-2 text-right font-mono text-slate-900">{d.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="print:break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Holdings</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Fund</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Invested</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Current Value</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Gain</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">XIRR</th>
              </tr>
            </thead>
            <tbody>
              {analysis.holdings.map((h: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 text-slate-800">{h.schemeName}</td>
                  <td className="py-2 text-right font-mono text-slate-700">{fmtCurrency(h.invested)}</td>
                  <td className="py-2 text-right font-mono text-slate-700">{fmtCurrency(h.currentVal)}</td>
                  <td className={`py-2 text-right font-mono ${h.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmtCurrency(h.gain)}</td>
                  <td className={`py-2 text-right font-mono font-bold ${h.xirr >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{h.xirr?.toFixed(2) ?? '0.00'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {riskAnalysis && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Risk Metrics</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Weighted Risk Score</p>
                <p className="text-lg font-bold text-slate-900">{riskAnalysis.weightedScore.toFixed(1)}/100</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Annualized Volatility</p>
                <p className="text-lg font-bold text-slate-900">{(riskAnalysis.weightedVol * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Concentration (HHI)</p>
                <p className="text-lg font-bold text-slate-900">{riskAnalysis.hhi.toFixed(4)}</p>
              </div>
            </div>
          </section>
        )}

        <section className="print:break-inside-avoid pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> FolioVeda is a portfolio analytics tool and does not provide investment advice.
            Mutual Fund investments are subject to market risks; read all scheme related documents carefully.
            All NAV data is sourced from third-party providers (AMFI/mfapi.in) and may have a reporting lag.
            Past performance is not indicative of future results. Report generated on {generatedAt}.
          </p>
        </section>
      </div>
    </div>
  );
}
