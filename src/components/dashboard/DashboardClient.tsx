"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, PieChart, AlertCircle, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { FadeIn } from '@/components/animations';
import PortfolioSectorChart from '@/components/portfolio/PortfolioSectorChart';
import { PortfolioHealthGauge } from '@/components/dashboard/PortfolioHealthGauge';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardClientProps {
  analysis: any;
  divScore: any;
  riskAnalysis?: any;
}

export default function DashboardClient({ analysis, divScore, riskAnalysis }: DashboardClientProps) {
  const stats = [
    { 
      label: 'Total Portfolio Value', 
      value: `₹${analysis.currentMarketValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 
      icon: <Wallet className="text-blue-600" />, 
      trend: analysis.absoluteGain >= 0 ? 'Positive' : 'Negative' 
    },
    { 
      label: 'Total Invested', 
      value: `₹${analysis.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 
      icon: <TrendingUp className="text-green-600" />, 
      trend: 'Principal' 
    },
    { 
      label: 'Overall XIRR', 
      value: `${analysis.overallXirr?.toFixed(2) ?? '0.00'}%`, 
      icon: <PieChart className="text-indigo-600" />, 
      trend: 'Annualized' 
    },
  ];

  const allocationData = divScore?.distribution 
    ? divScore.distribution.map((d: any) => ({ name: d.name, value: d.percentage }))
    : [
        { name: 'Equity', value: 60 },
        { name: 'Debt', value: 30 },
        { name: 'Hybrid', value: 10 },
      ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <FadeIn>
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Portfolio Overview</h1>
            <p className="text-slate-500">Live analysis of your mutual fund investments.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Last updated</p>
            <p className="text-sm font-medium text-slate-700">Today, 11:00 PM IST</p>
          </div>
        </header>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow duration-300 cursor-default">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs font-medium text-slate-400">{stat.trend}</p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {(divScore?.score != null || riskAnalysis?.weightedScore != null) && (
        <FadeIn delay={0.15}>
          <PortfolioHealthGauge
            diversificationScore={divScore?.score ?? null}
            riskScore={riskAnalysis?.weightedScore ?? null}
          />
        </FadeIn>
      )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-64 w-full min-w-0">
              <FadeIn>
                <ResponsiveContainer width="100%" height={256}>
                  <RePie>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePie>
                </ResponsiveContainer>
              </FadeIn>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {allocationData.map((item: { name: string; value: number }, i: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-slate-600">{item.name}: {item.value?.toFixed(1) ?? '0.0'}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <FadeIn delay={0.6}>
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Fund Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.holdings.map((fund: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-all duration-200 hover:scale-[1.01]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{fund.schemeName}</p>
                        <p className="text-[10px] text-slate-400">Current Value: ₹{fund.currentVal.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${fund.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fund.xirr?.toFixed(2) ?? '0.00'}%
                      </p>
                      <p className="text-[10px] text-slate-400">XIRR</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divScore && (
          <FadeIn delay={0.8}>
            <Card className="border-none shadow-sm bg-white p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${divScore.score > 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Diversification Analysis</p>
                <p className="text-xs text-slate-500">{divScore.riskLevel}. {divScore.score < 70 ? 'Consider balancing your portfolio across different asset classes.' : 'Your portfolio is well-spread.'}</p>
              </div>
            </Card>
          </FadeIn>
        )}
        <FadeIn delay={0.9}>
          <Card className="border-none shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <Activity size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Quick Actions</p>
              <div className="flex gap-3 mt-2">
                <a href="/portfolio/risk" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  Risk Analysis <ArrowRight size={10} />
                </a>
                <a href="/risk-analysis" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  Fund Risk Ratings <ArrowRight size={10} />
                </a>
                <a href="/funds/compare" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  Compare Funds <ArrowRight size={10} />
                </a>
                <a href="/portfolio/overlap" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  Fund Overlap <ArrowRight size={10} />
                </a>
                <a href="/portfolio/report" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  Download Report <ArrowRight size={10} />
                </a>
                <a href="/tools/sip-calculator" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  SIP Calculator <ArrowRight size={10} />
                </a>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={1.0}>
        <PortfolioSectorChart />
      </FadeIn>

      <FadeIn delay={1.1}>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={18} />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong className="font-semibold">Compliance Note:</strong> Returns calculated using XIRR methodology based on your transaction history and latest available NAV. 
            Past performance is not a guarantee of future returns. Please refer to the scheme's SID for detailed risk factors.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
