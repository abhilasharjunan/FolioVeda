"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/animations';
import { AILoader } from '@/components/ui/AILoader';
import { MetricLabel, METRIC_EXPLANATIONS } from '@/components/ui/InfoTooltip';
import { Layers, AlertTriangle, TrendingUp } from 'lucide-react';

interface FundEntry {
  schemeCode: string;
  schemeName: string;
  category: string | null;
}

interface CommonStock {
  stockName: string;
  weightA: number;
  weightB: number;
  minWeight: number;
}

interface OverlapPair {
  schemeCodeA: string;
  schemeCodeB: string;
  schemeNameA: string;
  schemeNameB: string;
  overlapPercentage: number;
  commonStocks: CommonStock[];
}

function overlapColor(pct: number): string {
  if (pct >= 40) return 'bg-rose-500 text-white';
  if (pct >= 25) return 'bg-orange-400 text-white';
  if (pct >= 10) return 'bg-amber-300 text-slate-900';
  if (pct > 0) return 'bg-emerald-200 text-slate-900';
  return 'bg-slate-100 text-slate-400';
}

function shortName(name: string, max = 22): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

export default function PortfolioOverlapPage() {
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [pairs, setPairs] = useState<OverlapPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<OverlapPair | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/portfolio/overlap');
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setFunds(data.funds || []);
        setPairs(data.pairs || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load overlap data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const pairMap = useMemo(() => {
    const map = new Map<string, OverlapPair>();
    for (const p of pairs) {
      map.set(`${p.schemeCodeA}|${p.schemeCodeB}`, p);
      map.set(`${p.schemeCodeB}|${p.schemeCodeA}`, p);
    }
    return map;
  }, [pairs]);

  const topOverlap = useMemo(
    () => [...pairs].sort((a, b) => b.overlapPercentage - a.overlapPercentage)[0] || null,
    [pairs]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AILoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertTriangle size={40} className="text-rose-400" />
        <h2 className="text-xl font-bold text-slate-900">Couldn't load overlap data</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (funds.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Layers size={40} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Add at least 2 holdings</h2>
        <p className="text-slate-500 max-w-md">
          Portfolio overlap compares the stock holdings across your funds. Add a second fund to your portfolio to see how much they duplicate each other.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <FadeIn>
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <Layers size={16} />
            <span>Portfolio Intelligence</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            <MetricLabel label="Portfolio Overlap" tooltip={METRIC_EXPLANATIONS.overlapPercentage} />
          </h1>
          <p className="text-slate-500 max-w-2xl">
            How much your funds' top disclosed holdings duplicate each other. High overlap between two funds means you're paying two expense ratios for largely the same stocks.
          </p>
          <p className="text-xs text-slate-400 max-w-2xl">
            Based on each fund's top 15 disclosed holdings, not full portfolios — treat this as directional, not exact.
          </p>
        </header>

        {topOverlap && topOverlap.overlapPercentage > 0 && (
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg text-orange-600 shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Highest overlap: {topOverlap.overlapPercentage.toFixed(1)}%</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {topOverlap.schemeNameA} and {topOverlap.schemeNameB} share a significant chunk of top holdings.
                  {topOverlap.overlapPercentage >= 40 ? ' Worth reviewing whether you need both.' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-semibold">Overlap Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white p-2 min-w-[160px]" />
                    {funds.map((f) => (
                      <th key={f.schemeCode} className="p-2 text-[10px] font-semibold text-slate-500 min-w-[80px] max-w-[80px] align-bottom">
                        <div className="truncate" title={f.schemeName}>{shortName(f.schemeName, 14)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funds.map((rowFund) => (
                    <tr key={rowFund.schemeCode}>
                      <th className="sticky left-0 bg-white p-2 text-left text-xs font-semibold text-slate-700 min-w-[160px] max-w-[160px]">
                        <div className="truncate" title={rowFund.schemeName}>{shortName(rowFund.schemeName)}</div>
                      </th>
                      {funds.map((colFund) => {
                        if (rowFund.schemeCode === colFund.schemeCode) {
                          return (
                            <td key={colFund.schemeCode} className="p-1">
                              <div className="w-full h-10 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium">—</div>
                            </td>
                          );
                        }
                        const pair = pairMap.get(`${rowFund.schemeCode}|${colFund.schemeCode}`);
                        const pct = pair?.overlapPercentage;
                        return (
                          <td key={colFund.schemeCode} className="p-1">
                            <button
                              onClick={() => pair && setSelectedPair(pair)}
                              disabled={!pair}
                              className={`w-full h-10 rounded flex items-center justify-center text-xs font-bold transition-transform ${
                                pair ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                              } ${overlapColor(pct ?? -1)}`}
                              title={pair ? `${pair.overlapPercentage.toFixed(1)}% overlap` : 'No holdings data available'}
                            >
                              {pct != null ? `${pct.toFixed(0)}%` : 'N/A'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mt-4 px-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Low (&lt;10%)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300 inline-block" /> Moderate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Very High (40%+)</span>
              <span className="ml-auto">Click a cell for stock-level detail</span>
            </div>
          </CardContent>
        </Card>

        {selectedPair && (
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg font-semibold">
                {selectedPair.schemeNameA} vs {selectedPair.schemeNameB}
                <span className="ml-3 text-sm font-normal text-slate-400">{selectedPair.overlapPercentage.toFixed(1)}% overlap</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedPair.commonStocks.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No common stocks in their top disclosed holdings.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Weight in A</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Weight in B</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Overlap (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.commonStocks.map((s) => (
                        <tr key={s.stockName} className="border-b border-slate-50">
                          <td className="p-3 text-sm font-medium text-slate-800">{s.stockName}</td>
                          <td className="p-3 text-sm font-mono text-slate-600 text-right">{s.weightA.toFixed(2)}%</td>
                          <td className="p-3 text-sm font-mono text-slate-600 text-right">{s.weightB.toFixed(2)}%</td>
                          <td className="p-3 text-sm font-mono text-slate-900 font-bold text-right">{s.minWeight.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </FadeIn>
    </div>
  );
}
