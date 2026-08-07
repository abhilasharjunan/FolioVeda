"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { PageLoader } from '@/components/ui/PageLoader';
import { MetricLabel, METRIC_EXPLANATIONS } from '@/components/ui/InfoTooltip';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { Layers, AlertTriangle, ShieldCheck, PieChart } from 'lucide-react';

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

interface LookThroughSector {
  sector: string;
  weight: number;
}

interface SectorDiversification {
  hhi: number;
  band: 'diversified' | 'moderate' | 'concentrated';
  label: string;
  topSectors: LookThroughSector[];
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

function hhiBadge(band: SectorDiversification['band']): string {
  if (band === 'diversified') return 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10';
  if (band === 'moderate') return 'border-amber-500/40 text-amber-500 bg-amber-500/10';
  return 'border-rose-500/40 text-rose-500 bg-rose-500/10';
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
  const [sectors, setSectors] = useState<LookThroughSector[]>([]);
  const [sectorDiversification, setSectorDiversification] = useState<SectorDiversification | null>(null);
  const [concentratedTickers, setConcentratedTickers] = useState<LookThroughHolding[]>([]);
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
        setSectors(data.sectors || []);
        setSectorDiversification(data.sectorDiversification || null);
        setConcentratedTickers(data.concentratedTickers || []);
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

  const sectorChartData = useMemo(
    () => Object.fromEntries(sectors.map((s) => [s.sector, s.weight])),
    [sectors]
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
      <div className="px-4 py-6 sm:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertTriangle size={40} className="text-rose-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Couldn't load overlap data</h2>
        <p className="text-slate-500 dark:text-slate-300">{error}</p>
      </div>
    );
  }

  if (funds.length < 2) {
    return (
      <div className="px-4 py-6 sm:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Layers size={40} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Add at least 2 holdings</h2>
        <p className="text-slate-500 dark:text-slate-300 max-w-md">
          Portfolio overlap compares weighted stock holdings across your funds. Add a second fund to see duplication and look-through concentration.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:p-6 space-y-6 max-w-6xl mx-auto">
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
                Weighted MIN overlap between fund pairs, look-through stock exposure, and true sector mix after peeling open each fund.
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

      {sectorDiversification && sectors.length > 0 && (
        <FadeIn delay={0.03}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="surface-card border-none shadow-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2 text-slate-900 dark:text-slate-50">
                  <PieChart className="w-5 h-5 text-indigo-500" />
                  True Sector Allocation
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                  Look-through sector weights across your funds (portfolio weight × stock sector weight)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SectorPieChart data={sectorChartData} />
              </CardContent>
            </Card>
            <Card className="surface-card border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading text-slate-900 dark:text-slate-50">
                  <MetricLabel label="Sector Diversification (HHI)" tooltip={METRIC_EXPLANATIONS.hhi} />
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                  HHI = Σ (sector weight %)² · &lt;1500 green · 1500–2500 amber · &gt;2500 red
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                    {sectorDiversification.hhi.toLocaleString('en-IN')}
                  </p>
                  <Badge variant="outline" className={`mt-2 ${hhiBadge(sectorDiversification.band)}`}>
                    {sectorDiversification.label}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {sectorDiversification.topSectors.slice(0, 5).map((s) => (
                    <li key={s.sector} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600 dark:text-slate-300 truncate">{s.sector}</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-50 shrink-0">{s.weight.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {concentratedTickers.length > 0 && (
        <FadeIn delay={0.04}>
          <Card className="surface-card border-none shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2 text-slate-900 dark:text-slate-50">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Effective Ticker Concentration
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Stocks where look-through weight is ≥10% of your portfolio and held across 2+ funds — hidden single-name risk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {concentratedTickers.map((s) => (
                  <Badge
                    key={s.stockName}
                    variant="outline"
                    className="border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5"
                  >
                    {s.stockName}
                    <span className="ml-2 font-mono tabular-nums">{s.effectiveWeight.toFixed(1)}%</span>
                    <span className="ml-1 text-[10px] opacity-70">· {s.heldInFunds.length} funds</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

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
                  Could not load disclosed holdings for this pair. Try again later — the holdings feed may be temporarily unavailable.
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
                            <span className={`text-sm font-bold tabular-nums w-14 ${
                              stock.effectiveWeight >= 10
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
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
