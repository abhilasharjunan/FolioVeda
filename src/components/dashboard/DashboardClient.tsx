"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp, Wallet, PieChart, AlertCircle, ShieldAlert, ArrowRight,
  Activity, Layers, Calculator, FileText, GitCompare, BarChart3,
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import PortfolioSectorChart from '@/components/portfolio/PortfolioSectorChart';
import { PortfolioHealthGauge } from '@/components/dashboard/PortfolioHealthGauge';
import { ChartCard } from '@/components/ui/ChartCard';
import { AnimatedNumber } from '@/components/animations';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

interface DashboardClientProps {
  analysis: any;
  divScore: any;
  riskAnalysis?: any;
}

function formatReturn(fund: {
  xirr?: number | null;
  absoluteReturnPct?: number | null;
}) {
  if (fund.xirr != null) {
    return { value: fund.xirr, label: 'XIRR', isXirr: true as const };
  }
  if (fund.absoluteReturnPct != null) {
    return { value: fund.absoluteReturnPct, label: 'Abs. return', isXirr: false as const };
  }
  return null;
}

export default function DashboardClient({ analysis, divScore, riskAnalysis }: DashboardClientProps) {
  const allocationData = divScore?.distribution?.length
    ? divScore.distribution.map((d: any) => ({ name: d.name, value: d.percentage }))
    : [];

  const gainPct =
    analysis.totalInvested > 0
      ? ((analysis.absoluteGain / analysis.totalInvested) * 100)
      : 0;

  const overallAbsPct =
    analysis.totalInvested > 0
      ? ((analysis.absoluteGain / analysis.totalInvested) * 100)
      : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <header className="flex justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">Portfolio Overview</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live analysis of your mutual fund investments.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">As of</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
              {new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} IST
            </p>
          </div>
        </header>
      </FadeIn>

      {/* Unified KPI ribbon */}
      <FadeIn delay={0.05}>
        <Card className="surface-card border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700/80">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Wallet size={16} className="text-indigo-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Total Portfolio Value</p>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 tabular-nums">
                  ₹<AnimatedNumber value={analysis.currentMarketValue} decimals={0} />
                </p>
                <p className={`mt-1 text-xs font-semibold ${gainPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}% vs invested
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Total Invested</p>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 tabular-nums">
                  ₹<AnimatedNumber value={analysis.totalInvested} decimals={0} />
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Principal</p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <PieChart size={16} className="text-indigo-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Overall XIRR</p>
                </div>
                {analysis.overallXirr != null ? (
                  <>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 tabular-nums">
                      <AnimatedNumber value={analysis.overallXirr} decimals={2} />%
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Annualized</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 tabular-nums">
                      {overallAbsPct != null ? `${overallAbsPct >= 0 ? '+' : ''}${overallAbsPct.toFixed(2)}%` : 'N/A'}
                    </p>
                    <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {overallAbsPct != null ? 'Abs. return · hold longer for XIRR' : 'Unable to calculate'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Health + Allocation side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(divScore?.score != null || riskAnalysis?.weightedScore != null) && (
          <FadeIn delay={0.08}>
            <PortfolioHealthGauge
              diversificationScore={divScore?.score ?? null}
              riskScore={riskAnalysis?.weightedScore ?? null}
            />
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
          <ChartCard title="Asset Allocation" className="h-full">
            {allocationData.length > 0 ? (
              <>
                <div className="h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height={224}>
                    <RePie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={700}
                      >
                        {allocationData.map((entry: { name: string; value: number }, index: number) => (
                          <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Share']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
                          background: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))',
                        }}
                      />
                    </RePie>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 w-full">
                  {allocationData.map((item: { name: string; value: number }, i: number) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.name}: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value?.toFixed(1) ?? '0.0'}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Add holdings to see allocation.
              </div>
            )}
          </ChartCard>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.12} className="lg:col-span-2">
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold font-heading text-slate-900 dark:text-slate-50">Fund Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <StaggerChildren className="space-y-2.5" stagger={0.04}>
                {analysis.holdings.map((fund: any, i: number) => {
                  const ret = formatReturn(fund);
                  return (
                    <StaggerItem key={fund.schemeCode || i}>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/60 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs shrink-0">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{fund.schemeName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Current Value: ₹{Number(fund.currentVal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          {ret ? (
                            <>
                              <p className={`text-sm font-bold tabular-nums ${
                                ret.value >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {ret.value >= 0 ? '+' : ''}{ret.value.toFixed(2)}%
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{ret.label}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-slate-400">N/A</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">Insufficient data</p>
                            </>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerChildren>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.14} className="space-y-4">
          {divScore && (
            <Card className="surface-card border-none shadow-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-full shrink-0 ${
                  divScore.score > 70
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  <ShieldAlert size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Diversification Analysis</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {divScore.riskLevel}. {divScore.score < 70
                      ? 'Consider balancing your portfolio across different asset classes.'
                      : 'Your portfolio is well-spread.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="surface-card border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { href: '/portfolio/risk', label: 'Risk X-Ray', icon: Activity },
                { href: '/portfolio/overlap', label: 'Fund Overlap', icon: Layers },
                { href: '/risk-analysis', label: 'Fund Ratings', icon: BarChart3 },
                { href: '/funds/compare', label: 'Compare', icon: GitCompare },
                { href: '/portfolio/report', label: 'Report', icon: FileText },
                { href: '/tools/sip-calculator', label: 'SIP Planner', icon: Calculator },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-3 text-left hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  <Icon size={16} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="surface-card border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden relative">
            <Layers className="absolute -right-3 -bottom-3 text-white/10" size={88} strokeWidth={1} />
            <CardContent className="p-4 relative">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Overlap Analyzer</p>
              <p className="text-sm font-medium mt-1.5 leading-snug">
                Check how much stock overlap sits across your funds.
              </p>
              <Link
                href="/portfolio/overlap"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-white hover:underline"
              >
                Open overlap tool <ArrowRight size={12} />
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.18}>
        <PortfolioSectorChart />
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="bg-indigo-50/80 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
          <AlertCircle className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" size={18} />
          <p className="text-xs text-indigo-800 dark:text-indigo-200/90 leading-relaxed">
            <strong className="font-semibold">Compliance Note:</strong> Returns use XIRR when transaction history spans at least one day; otherwise absolute return is shown.
            Past performance is not a guarantee of future returns.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
