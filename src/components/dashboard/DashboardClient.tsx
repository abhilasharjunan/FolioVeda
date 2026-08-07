"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, PieChart, AlertCircle, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import PortfolioSectorChart from '@/components/portfolio/PortfolioSectorChart';
import { PortfolioHealthGauge } from '@/components/dashboard/PortfolioHealthGauge';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

interface DashboardClientProps {
  analysis: any;
  divScore: any;
  riskAnalysis?: any;
}

export default function DashboardClient({ analysis, divScore, riskAnalysis }: DashboardClientProps) {
  const allocationData = divScore?.distribution
    ? divScore.distribution.map((d: any) => ({ name: d.name, value: d.percentage }))
    : [
        { name: 'Equity', value: 60 },
        { name: 'Debt', value: 30 },
        { name: 'Hybrid', value: 10 },
      ];

  const gainPct =
    analysis.totalInvested > 0
      ? ((analysis.absoluteGain / analysis.totalInvested) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <header className="flex justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">Portfolio Overview</h1>
            <p className="text-slate-500 dark:text-slate-400">Live analysis of your mutual fund investments.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">As of</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} IST
            </p>
          </div>
        </header>
      </FadeIn>

      <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.07}>
        <StaggerItem>
          <MetricCard
            label="Total Portfolio Value"
            value={analysis.currentMarketValue}
            prefix="₹"
            decimals={0}
            icon={<Wallet className="text-blue-600" />}
            delta={{ value: gainPct, label: '% vs invested' }}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Total Invested"
            value={analysis.totalInvested}
            prefix="₹"
            decimals={0}
            icon={<TrendingUp className="text-emerald-600" />}
            hint="Principal"
          />
        </StaggerItem>
        <StaggerItem>
          {analysis.overallXirr != null ? (
            <MetricCard
              label="Overall XIRR"
              value={analysis.overallXirr}
              suffix="%"
              decimals={2}
              icon={<PieChart className="text-blue-600" />}
              hint="Annualized"
            />
          ) : (
            <MetricCard
              label="Overall XIRR"
              value="N/A"
              animate={false}
              icon={<PieChart className="text-blue-600" />}
              hint="Unable to calculate"
            />
          )}
        </StaggerItem>
      </StaggerChildren>

      {(divScore?.score != null || riskAnalysis?.weightedScore != null) && (
        <FadeIn delay={0.12}>
          <PortfolioHealthGauge
            diversificationScore={divScore?.score ?? null}
            riskScore={riskAnalysis?.weightedScore ?? null}
          />
        </FadeIn>
      )}

      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-6" stagger={0.08} delay={0.05}>
        <StaggerItem className="lg:col-span-1">
          <ChartCard title="Asset Allocation">
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height={256}>
                <RePie>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={84}
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
                    }}
                  />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2 w-full">
              {allocationData.map((item: { name: string; value: number }, i: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {item.name}: {item.value?.toFixed(1) ?? '0.0'}%
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold font-heading">Fund Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <StaggerChildren className="space-y-3" stagger={0.05}>
                {analysis.holdings.map((fund: any, i: number) => (
                  <StaggerItem key={fund.schemeCode || i}>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{fund.schemeName}</p>
                          <p className="text-[10px] text-slate-400">
                            Current Value: ₹{fund.currentVal.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${
                          fund.xirr == null
                            ? 'text-slate-400'
                            : fund.xirr >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}>
                          {fund.xirr != null ? `${fund.xirr.toFixed(2)}%` : 'N/A'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {fund.xirr != null ? 'XIRR' : 'Insufficient data'}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerChildren>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divScore && (
          <FadeIn delay={0.15}>
            <Card className="surface-card border-none shadow-sm p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${divScore.score > 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Diversification Analysis</p>
                <p className="text-xs text-slate-500">
                  {divScore.riskLevel}. {divScore.score < 70
                    ? 'Consider balancing your portfolio across different asset classes.'
                    : 'Your portfolio is well-spread.'}
                </p>
              </div>
            </Card>
          </FadeIn>
        )}
        <FadeIn delay={0.2}>
          <Card className="surface-card border-none shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950">
              <Activity size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Quick Actions</p>
              <div className="flex flex-wrap gap-x-3 gap-y-2 mt-2">
                {[
                  ['/portfolio/risk', 'Risk Analysis'],
                  ['/risk-analysis', 'Fund Risk Ratings'],
                  ['/funds/compare', 'Compare Funds'],
                  ['/portfolio/overlap', 'Fund Overlap'],
                  ['/portfolio/report', 'Download Report'],
                  ['/tools/sip-calculator', 'SIP Calculator'],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    {label} <ArrowRight size={10} />
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.25}>
        <PortfolioSectorChart />
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-100 dark:border-blue-900 flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
          <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
            <strong className="font-semibold">Compliance Note:</strong> Returns calculated using XIRR methodology based on your transaction history and latest available NAV.
            Past performance is not a guarantee of future returns. Please refer to the scheme&apos;s SID for detailed risk factors.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
