"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Search, ChevronUp, ChevronDown, ShieldAlert, Activity, Zap 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { RiskOMeterInline } from '@/components/funds/RiskOMeterInline';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { VolatilityChart } from '@/components/funds/VolatilityChart';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';
import { downloadCSV } from '@/lib/export';
import { MetricLabel, METRIC_EXPLANATIONS } from '@/components/ui/InfoTooltip';

type FundCategory = 
  | "Large Cap" | "Mid Cap" | "Small Cap" | "Flexi Cap" 
  | "ELSS" | "Debt" | "Hybrid" | "Index Funds" | "International Funds";

interface RiskMetrics {
  volatility: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  sharpeRatio: number;
  sortinoRatio: number;
  concentrationRisk: number;
  sectorConcentration: number;
  compositeScore: number;
  alpha: number;
  beta: number;
  rSquared: number;
  treynorRatio: number;
}

interface FundRiskData {
  schemeCode: string;
  schemeName: string;
  category: FundCategory;
  metrics: RiskMetrics;
  fundManagerName?: string | null;
  fundManagerTenure?: string | null;
}

const CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
];

export default function RiskAnalysisPage() {
  const [data, setData] = useState<Record<string, FundRiskData[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FundCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'compositeScore',
    direction: 'desc',
  });
  const [selectedFund, setSelectedFund] = useState<FundRiskData | null>(null);

  useEffect(() => {
    async function fetchRiskData() {
      try {
        const res = await fetch('/api/funds/risk-analysis');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch risk data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRiskData();
  }, []);

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-green-500';
    if (score < 40) return 'text-green-400';
    if (score < 60) return 'text-yellow-500';
    if (score < 80) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProcessedData = () => {
    if (!data) return [];
    const list: FundRiskData[] = [];
    Object.entries(data).forEach(([cat, funds]) => {
      funds.forEach(f => {
        if ((activeCategory === 'All' || cat === activeCategory) &&
            (f.schemeName.toLowerCase().includes(searchQuery.toLowerCase()))) {
          list.push({ ...f, category: cat as FundCategory });
        }
      });
    });
    return list.sort((a, b) => {
      const aVal = a.metrics[sortConfig.key as keyof RiskMetrics] || 0;
      const bVal = b.metrics[sortConfig.key as keyof RiskMetrics] || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const currentFunds = getProcessedData();

  const fetchDetailedInsights = async (schemeCode: string) => {
    try {
      const res = await fetch(`/api/funds/${schemeCode}`);
      const json = await res.json();
      return json;
    } catch (e) {
      return null;
    }
  };

  const handleFundClick = async (fund: FundRiskData) => {
    setSelectedFund(fund);
    // In a real app, we'd trigger a loading state for the detailed panel
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <SkeletonText className="h-8 w-64" />
            <SkeletonText className="h-4 w-96" />
          </div>
          <SkeletonText className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
        <SkeletonChart height="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <FadeIn>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm uppercase tracking-wider">
               <ShieldAlert size={16} />
               <span>Risk Intelligence</span>
             </div>

            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Fund Risk Analysis</h1>
            <p className="text-slate-500 max-w-2xl">
              Quantitative assessment of portfolio volatility, drawdown, and concentration risk across benchmark funds.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="px-3 py-1 text-xs font-medium text-slate-400">Data refreshed every 24h</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600 w-fit">
                <Activity size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 text-sm font-medium">Market Volatility</p>
                <h3 className="text-2xl font-bold text-slate-900">Moderate</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600 w-fit">
                <Zap size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 text-sm font-medium">Highest Risk Cat</p>
                <h3 className="text-2xl font-bold text-slate-900">Small Cap</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 w-fit">
                <TrendingUp size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 text-sm font-medium">Total Schemes</p>
                <h3 className="text-2xl font-bold text-slate-900">{Object.keys(data || {}).reduce((sum, cat) => sum + (data?.[cat]?.length || 0), 0)} Funds</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
            <button 
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === 'All' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search funds..." 
              className="pl-10 rounded-full bg-white border-slate-200 focus:ring-rose-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              const csvData = currentFunds.map(f => ({
                'Scheme Name': f.schemeName,
                'Category': f.category,
                'Risk Score': f.metrics.compositeScore.toFixed(2),
                'Volatility': (f.metrics.volatility * 100).toFixed(2) + '%',
                'Sharpe Ratio': f.metrics.sharpeRatio.toFixed(2),
                'Sortino Ratio': f.metrics.sortinoRatio.toFixed(2),
                'Max DD': (f.metrics.maxDrawdown * 100).toFixed(2) + '%',
                'Max DD Duration (months)': f.metrics.maxDrawdownDuration,
                'Alpha': (f.metrics.alpha * 100).toFixed(2) + '%',
                'Beta': f.metrics.beta.toFixed(2),
                'R-Squared': (f.metrics.rSquared * 100).toFixed(2) + '%',
                'Treynor Ratio': f.metrics.treynorRatio.toFixed(2),
              }));
              downloadCSV(csvData, 'fund-risk-analysis');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fund</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-rose-600" onClick={() => setSortConfig({key: 'compositeScore', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>
                       <MetricLabel label="Risk Score" tooltip={METRIC_EXPLANATIONS.compositeScore} />
                       {sortConfig.key === 'compositeScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                     </th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"><MetricLabel label="Volatility" tooltip={METRIC_EXPLANATIONS.volatility} /></th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"><MetricLabel label="Sharpe" tooltip={METRIC_EXPLANATIONS.sharpeRatio} /></th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"><MetricLabel label="Sortino" tooltip={METRIC_EXPLANATIONS.sortinoRatio} /></th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"><MetricLabel label="Max DD" tooltip={METRIC_EXPLANATIONS.maxDrawdown} /></th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">DD Duration</th>
                     <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Bar</th>
                   </tr>
                </thead>
                <tbody>
                  {currentFunds.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-slate-400 font-medium">No risk data available.</td></tr>
                  ) : (
                    currentFunds.map((fund) => (
                      <tr 
                        key={fund.schemeCode} 
                        onClick={() => handleFundClick(fund)}
                        className="border-b border-slate-50 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{fund.schemeName}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">{fund.category}</span>
                          </div>
                        </td>
                        <td className={`p-4 text-sm font-mono font-bold ${getRiskColor(fund.metrics.compositeScore)}`}>
                          {fund.metrics.compositeScore.toFixed(1)}
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-600">{(fund.metrics.volatility * 100).toFixed(2)}%</td>
                        <td className="p-4 text-sm font-mono text-slate-600">{fund.metrics.sharpeRatio.toFixed(2)}</td>
                        <td className="p-4 text-sm font-mono text-slate-600">{fund.metrics.sortinoRatio.toFixed(2)}</td>
                        <td className="p-4 text-sm font-mono text-rose-600">{(fund.metrics.maxDrawdown * 100).toFixed(2)}%</td>
                        <td className="p-4 text-sm font-mono text-slate-600">{fund.metrics.maxDrawdownDuration}mo</td>
                        <td className="p-4">
                          <RiskOMeterInline level={
                            fund.metrics.compositeScore < 20 ? 'Low' :
                            fund.metrics.compositeScore < 40 ? 'Low to Moderate' :
                            fund.metrics.compositeScore < 60 ? 'Moderate' :
                            fund.metrics.compositeScore < 80 ? 'Moderate to High' :
                            fund.metrics.compositeScore < 90 ? 'High' : 'Very High'
                          } />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white p-6 space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold">Risk Details</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              {!selectedFund ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
                  <ShieldAlert size={40} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Select a fund to view deep risk analysis</p>
                </div>
              ) : (
                <FadeIn>
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                        <MetricLabel label="Portfolio Concentration (HHI)" tooltip={METRIC_EXPLANATIONS.concentrationRisk} />
                      </h4>
                      <div className="flex items-end justify-between mb-1">
                        <span className="text-2xl font-bold text-slate-900">{selectedFund.metrics.concentrationRisk.toFixed(4)}</span>
                        <span className="text-xs text-slate-500">Higher = More Concentrated</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-500" 
                          style={{ width: `${Math.min(selectedFund.metrics.concentrationRisk * 1000, 100)}%` }}
                        />
                      </div>
                    </div>

                     <div className="space-y-2">
                       <h4 className="text-xs font-bold text-slate-400 uppercase px-1">Fund Manager</h4>
                       <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-sm font-medium text-slate-600">Name</span>
                             <span className="text-sm font-medium text-slate-900">{selectedFund.fundManagerName || 'Not Available'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm font-medium text-slate-600">Tenure</span>
                             <span className="text-sm font-medium text-slate-900">{selectedFund.fundManagerTenure || 'Not Available'}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       <h4 className="text-xs font-bold text-slate-400 uppercase px-1">Sector Exposure</h4>
                       <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                         <SectorPieChart data={selectedFund.metrics.sectorConcentration > 0 ? { "Top Sectors": selectedFund.metrics.sectorConcentration, "Others": 100 - selectedFund.metrics.sectorConcentration } : {}} />
                       </div>
                     </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase px-1">Volatility Trend (3Y)</h4>
                      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <VolatilityChart data={[{date: '2023', value: 0.12}, {date: '2024', value: 0.15}, {date: '2025', value: 0.11}, {date: '2026', value: 0.14}]} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          <MetricLabel label="Sharpe Ratio" tooltip={METRIC_EXPLANATIONS.sharpeRatio} />
                        </p>
                        <p className="text-lg font-bold text-slate-900">{selectedFund.metrics.sharpeRatio.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          <MetricLabel label="Max Drawdown" tooltip={METRIC_EXPLANATIONS.maxDrawdown} />
                        </p>
                        <p className="text-lg font-bold text-rose-600">{(selectedFund.metrics.maxDrawdown * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
