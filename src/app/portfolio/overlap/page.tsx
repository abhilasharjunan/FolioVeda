"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { PageLoader } from '@/components/ui/PageLoader';
import { MetricLabel, METRIC_EXPLANATIONS } from '@/components/ui/InfoTooltip';
import { Layers, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FundEntry {
  schemeCode: string;
  schemeName: string;
  category: string | null;
  portfolioWeight?: number;
}

interface CommonStock {
  stockName: string;
  weightA: number;
  weightB: number;
  minWeight: number;
  sector?: string;
}

interface OverlapPair {
  schemeCodeA: string;
  schemeCodeB: string;
  schemeNameA: string;
  schemeNameB: string;
  overlapPercentage: number;
  commonStocks: CommonStock[];
  commonCount: number;
  dataAvailable: boolean;
}

interface LookThroughHolding {
  stockName: string;
  sector: string;
  effectiveWeight: number;
  heldInFunds: { schemeCode: string; schemeName: string; weightInFund: number; contribution: number }[];
}

function shortName(name: string, max = 28): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function overlapStatus(pct: number, available: boolean): { label: string; className: string } {
  if (!available) return { label: 'No data', className: 'border-slate-500/40 text-slate-400 bg-slate-500/10' };
  if (pct >= 40) return { label: 'Very High', className: 'border-rose-500/40 text-rose-400 bg-rose-500/10' };
  if (pct >= 25) return { label: 'High Overlap', className: 'border-orange-500/40 text-orange-400 bg-orange-500/10' };
  if (pct >= 10) return { label: 'Moderate', className: 'border-amber-500/40 text-amber-400 bg-amber-500/10' };
  if (pct > 0) return { label: 'Low Overlap', className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' };
  return { label: 'Optimal', className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' };
}

function MiniProgress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PortfolioOverlapPage() {
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [pairs, setPairs] = useState<OverlapPair[]>([]);
  const [lookThrough, setLookThrough] = useState<LookThroughHolding[]>([]);
  const [insightsAvailable, setInsightsAvailable] = useState(0);
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
        setLookThrough(data.lookThrough || []);
        setInsightsAvailable(data.insightsAvailable || 0);
        const sorted = [...(data.pairs || [])]
          .filter((p: OverlapPair) => p.dataAvailable)
          .sort((a: OverlapPair, b: OverlapPair) => b.overlapPercentage - a.overlapPercentage);
        if (sorted[0]) setSelectedPair(sorted[0]);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load overlap data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const highOverlapCount = useMemo(
    () => pairs.filter((p) => p.dataAvailable && p.overlapPercentage >= 25).length,
    [pairs]
  );

  const sortedPairs = useMemo(
    () => [...pairs].sort((a, b) => {
      if (a.dataAvailable !== b.dataAvailable) return a.dataAvailable ? -1 : 1;
      return b.overlapPercentage - a.overlapPercentage;
    }),
    [pairs]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertTriangle size={40} className="text-rose-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Couldn't load overlap data</h2>
        <p className="text-slate-500 dark:text-slate-300">{error}</p>
      </div>
    );
  }

  if (funds.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Layers size={40} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Add at least 2 holdings</h2>
        <p className="text-slate-500 dark:text-slate-300 max-w-md">
          Portfolio overlap compares weighted stock holdings across your funds. Add a second fund to see duplication and look-through concentration.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <FadeIn>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                <Layers size={16} />
                <span>Portfolio Insights</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-1 font-heading">
                <MetricLabel label="Stock Overlap & Concentration" tooltip={METRIC_EXPLANATIONS.overlapPercentage} />
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mt-2 text-sm leading-relaxed">
                Weighted MIN overlap between fund pairs, plus look-through exposure to the stocks you actually own across the portfolio.
              </p>
            </div>
            {highOverlapCount > 0 ? (
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 h-8 px-3">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {highOverlapCount} pair{highOverlapCount > 1 ? 's' : ''} with high overlap
              </Badge>
            ) : insightsAvailable >= 2 ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 h-8 px-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                No high-overlap pairs
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Based on each fund&apos;s top disclosed holdings (not the full book). Holdings data available for {insightsAvailable} of {funds.length} funds.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="surface-card border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-heading flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Layers className="w-5 h-5 text-indigo-500" />
              Pairwise Fund Overlap
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Overlap % = sum of min(weight in Fund A, weight in Fund B) across shared stocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedPairs.map((pair) => {
                const status = overlapStatus(pair.overlapPercentage, pair.dataAvailable);
                const active =
                  selectedPair?.schemeCodeA === pair.schemeCodeA &&
                  selectedPair?.schemeCodeB === pair.schemeCodeB;
                return (
                  <button
                    key={`${pair.schemeCodeA}-${pair.schemeCodeB}`}
                    type="button"
                    onClick={() => setSelectedPair(pair)}
                    className={`text-left p-4 rounded-xl border space-y-3 transition-colors ${
                      active
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-600/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span className="truncate" title={pair.schemeNameA}>{shortName(pair.schemeNameA, 22)}</span>
                      <span className="text-slate-400 shrink-0">vs</span>
                      <span className="truncate text-right" title={pair.schemeNameB}>{shortName(pair.schemeNameB, 22)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                        {pair.dataAvailable ? `${pair.overlapPercentage.toFixed(1)}%` : 'N/A'}
                      </span>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    {pair.dataAvailable && <MiniProgress value={Math.min(pair.overlapPercentage, 60)} max={60} />}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pair.dataAvailable
                        ? `${pair.commonCount} overlapping stock${pair.commonCount === 1 ? '' : 's'} shared`
                        : 'Holdings feed unavailable for one or both funds'}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {selectedPair && (
        <FadeIn delay={0.08}>
          <Card className="surface-card border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-heading text-slate-900 dark:text-slate-50">
                {shortName(selectedPair.schemeNameA, 36)} vs {shortName(selectedPair.schemeNameB, 36)}
                {selectedPair.dataAvailable && (
                  <span className="ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">
                    {selectedPair.overlapPercentage.toFixed(1)}% weighted overlap
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedPair.dataAvailable ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                  Could not load disclosed holdings for this pair. Try again later — the FinAPI/AMFI feed may be temporarily unavailable.
                </p>
              ) : selectedPair.commonStocks.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No common stocks in their top disclosed holdings.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Weight in A</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Weight in B</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Overlap (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.commonStocks.map((s) => (
                        <tr key={s.stockName} className="border-b border-slate-50 dark:border-slate-800/80">
                          <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                            {s.stockName}
                            {s.sector && s.sector !== 'Other' && (
                              <span className="ml-2 text-[10px] text-slate-400">{s.sector}</span>
                            )}
                          </td>
                          <td className="p-3 text-sm font-mono text-slate-600 dark:text-slate-300 text-right">{s.weightA.toFixed(2)}%</td>
                          <td className="p-3 text-sm font-mono text-slate-600 dark:text-slate-300 text-right">{s.weightB.toFixed(2)}%</td>
                          <td className="p-3 text-sm font-mono font-bold text-slate-900 dark:text-slate-50 text-right">{s.minWeight.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-slate-900 dark:text-slate-50">Top Look-Through Holdings</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Effective weight = portfolio fund weight × stock weight inside each fund. Shows your true aggregated stock exposure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lookThrough.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                Look-through holdings unavailable until disclosed stock weights are fetched for your funds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company / Stock</th>
                      <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Effective Weight</th>
                      <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Held Across Schemes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lookThrough.map((stock) => (
                      <tr key={stock.stockName} className="border-b border-slate-100 dark:border-slate-800/70">
                        <td className="py-3 pr-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{stock.stockName}</p>
                          {stock.sector && stock.sector !== 'Other' && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{stock.sector}</p>
                          )}
                        </td>
                        <td className="py-3 pr-3 min-w-[160px]">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums w-14">
                              {stock.effectiveWeight.toFixed(1)}%
                            </span>
                            <div className="flex-1 max-w-[120px]">
                              <MiniProgress value={stock.effectiveWeight} max={Math.max(lookThrough[0]?.effectiveWeight || 10, 10)} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {stock.heldInFunds.map((f) => (
                              <Badge
                                key={f.schemeCode}
                                variant="secondary"
                                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-normal"
                                title={`${f.weightInFund.toFixed(1)}% of fund · ${f.contribution.toFixed(2)}% of portfolio`}
                              >
                                {shortName(f.schemeName, 18)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
