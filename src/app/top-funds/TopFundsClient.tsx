"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Search, ChevronUp, ChevronDown, Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { PageLoader } from '@/components/ui/PageLoader';
import { downloadCSV } from '@/lib/export';

type FundCategory =
  | "Large Cap" | "Mid Cap" | "Small Cap" | "Flexi Cap"
  | "ELSS" | "Debt" | "Hybrid" | "Index Funds" | "International Funds";

interface FundData {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  nav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
  rank: number;
}

const CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap",
  "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
];

export default function TopFundsClient() {
  const router = useRouter();
  const [fundsData, setFundsData] = useState<Record<string, FundData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FundCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '3Y',
    direction: 'desc',
  });

  const currentFunds = useMemo(() => {
    const list: any[] = [];
    Object.entries(fundsData).forEach(([cat, funds]) => {
      funds.forEach((f: any) => {
        if ((activeCategory === 'All' || cat === activeCategory) &&
            (f.schemeName.toLowerCase().includes(searchQuery.toLowerCase()))) {
          list.push({ ...f, category: cat });
        }
      });
    });
    return list.sort((a, b) => {
      const aVal = a.returns[sortConfig.key] || 0;
      const bVal = b.returns[sortConfig.key] || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [fundsData, activeCategory, searchQuery, sortConfig]);

  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/funds/top-performing');
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }
      setFundsData(data);
    } catch (e: any) {
      console.error("Failed to fetch funds", e);
      setError(e.message || "We're having trouble loading fund data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
  };

  const getReturnColor = (val: number | null) => {
    if (val === null) return 'text-slate-400 dark:text-slate-400';
    if (val >= 15) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (val >= 0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400 font-bold';
  };

  const formatReturn = (val: number | null | undefined) => {
    if (val == null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/30">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
            <TrendingUp size={32} className="rotate-180" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Data fetch failed</h3>
          <p className="text-slate-500 dark:text-slate-300 max-w-md">{error}</p>
          <button
            onClick={() => fetchFunds()}
            className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  const ReturnCell = ({ value }: { value: number | null | undefined }) => {
    const width = value == null ? 0 : Math.min(100, Math.abs(value) * 4);
    return (
      <div className="space-y-1">
        <p className={`text-sm font-mono ${getReturnColor(value ?? null)}`}>{formatReturn(value)}</p>
        {value != null && (
          <div className="h-1 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${width}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto min-h-screen">
      <FadeIn>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              <TrendingUp size={16} />
              <span>Market Insights</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight font-heading">Top Performing Funds</h1>
            <p className="text-slate-500 dark:text-slate-300 max-w-2xl">
              Direct Growth plans only · updated daily. Ranked by 3Y CAGR across a curated
              shortlist of well-established funds spanning 9 categories, plus other
              AMFI-listed Direct Growth funds once enough NAV history has accumulated.
            </p>
          </div>
          <div className="flex items-center gap-3 surface-card p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-400">Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
            {(['All', ...CATEGORIES] as const).map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    active ? 'text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="top-funds-cat-pill"
                      className="absolute inset-0 rounded-full bg-slate-900 dark:bg-blue-600 shadow-md"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{cat === 'All' ? 'All Categories' : cat}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" size={16} />
            <Input
              placeholder="Search funds..."
              className="pl-10 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              const csvData = currentFunds.map((f: any, idx: number) => ({
                'Rank': idx + 1,
                'Scheme Name': f.schemeName,
                'Category': f.category,
                'NAV': f.nav,
                '1Y': f.returns?.['1Y']?.toFixed(2) != null ? f.returns['1Y'].toFixed(2) + '%' : '',
                '3Y': f.returns?.['3Y']?.toFixed(2) != null ? f.returns['3Y'].toFixed(2) + '%' : '',
                '5Y': f.returns?.['5Y']?.toFixed(2) != null ? f.returns['5Y'].toFixed(2) + '%' : '',
              }));
              downloadCSV(csvData, 'top-performing-funds');
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Award size={20} />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">Top Performer</Badge>
              </div>
              <div className="mt-8">
                <p className="text-blue-100 text-sm font-medium">Leading category (3Y)</p>
                <h3 className="text-2xl font-bold font-heading">
                  {Object.entries(fundsData).sort((a, b) =>
                    (b[1][0]?.returns?.['3Y'] ?? -Infinity) - (a[1][0]?.returns?.['3Y'] ?? -Infinity)
                  )[0]?.[0] ?? '—'}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card border-none shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 dark:bg-teal-950/40 rounded-lg text-blue-600 dark:text-teal-400">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="mt-8">
                <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">Analyzed Schemes</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
                  {Object.values(fundsData).flat().length} Analyzed
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="sm:hidden space-y-3">
          {currentFunds.length === 0 ? (
            <Card className="surface-card border-none shadow-sm p-8 text-center text-slate-400 dark:text-slate-400 font-medium">
              No funds matching your search or filter.
            </Card>
          ) : (
            <StaggerChildren key={String(activeCategory) + searchQuery} className="space-y-3" stagger={0.04}>
              {currentFunds.map((fund: any, idx: number) => (
                <StaggerItem key={fund.schemeCode}>
                  <Card
                    className="surface-card border-none shadow-sm p-4 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800"
                    onClick={() => router.push(`/funds/${fund.schemeCode}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{fund.schemeName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-medium">{fund.category} · ₹{fund.nav?.toFixed(2) ?? 'N/A'}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 shrink-0">#{activeCategory === 'All' ? idx + 1 : fund.rank}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      {(['1Y', '3Y', '5Y'] as const).map((k) => (
                        <div key={k}>
                          <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-bold">{k}</p>
                          <p className={`text-xs font-mono ${getReturnColor(fund.returns[k])}`}>{formatReturn(fund.returns[k])}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>

        <Card className="hidden sm:block surface-card border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">Rank</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fund Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">NAV</th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('1M')}>
                    1M {sortConfig.key === '1M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('3M')}>
                    3M {sortConfig.key === '3M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('6M')}>
                    6M {sortConfig.key === '6M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('1Y')}>
                    1Y {sortConfig.key === '1Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('3Y')}>
                    3Y {sortConfig.key === '3Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('5Y')}>
                    5Y {sortConfig.key === '5Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('10Y')}>
                    10Y {sortConfig.key === '10Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:text-teal-400 transition-colors" onClick={() => handleSort('sinceInception')}>
                      Inception {sortConfig.key === 'sinceInception' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                    </th>
                </tr>
              </thead>
              <tbody>
                {currentFunds.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400 dark:text-slate-400 font-medium">
                      No funds matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  currentFunds.map((fund: any, idx: number) => (
                    <tr
                      key={fund.schemeCode}
                      onClick={() => router.push(`/funds/${fund.schemeCode}`)}
                      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer group"
                    >
                      <td className="p-4 text-sm font-bold text-slate-400 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/80 z-10">
                        #{activeCategory === 'All' ? idx + 1 : fund.rank}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{fund.schemeName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-medium">{fund.category}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">₹{fund.nav?.toFixed(2) ?? 'N/A'}</td>
                      <td className="p-4"><ReturnCell value={fund.returns['1M']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['3M']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['6M']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['1Y']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['3Y']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['5Y']} /></td>
                      <td className="p-4"><ReturnCell value={fund.returns['10Y']} /></td>
                      <td className="p-4"><ReturnCell value={fund.sinceInception} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
