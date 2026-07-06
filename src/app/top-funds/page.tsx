"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Search,
  ChevronUp, ChevronDown, Award, Sparkles 
} from 'lucide-react';

import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';
import { ProgressCircle } from '@/components/ui/ProgressCircle';
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
}

const CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", 
  "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds"
];

export default function TopFundsPage() {
  const router = useRouter();
  const [fundsData, setFundsData] = useState<Record<string, FundData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FundCategory | 'All'>('All');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('Loading...');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '3Y',
    direction: 'desc',
  });
  const isMounted = useRef(true);

  const currentFunds = useMemo(() => {
    if (!fundsData) return [];
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
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatus('Starting...');
    
    try {
      // Step 1: Get popular fund codes (we'll fetch a predefined list of popular funds)
      setStatus('Preparing fund list...');
      setProgress(5);
      
      // For demonstration, we'll use a mix of popular funds from different categories
      // In a real app, this might come from a database or be dynamically determined
      const popularFundCodes = [
        // Large Cap
        "118531", "118839", "120503", "118840", "120657", "118837", "118530", 
        // Mid Cap
        "120541", "120540", "118831", "118832", "118833", "119075", "119213",
        // Small Cap
        "118844", "118845", "118846", "118847", "118848", "119223", "119412",
        // ELSS
        "118834", "118835", "118836", "118837", "118838", "120531", "120532",
        // Debt
        "149031", "149032", "149033", "149034", "149035", "120523", "120524",
        // Hybrid
        "120543", "120544", "120545", "120546", "120547", "120548", "120549",
        // Others
        "119176", "119177", "119178", "119606", "119607"
      ];
      
      // Step 2: Fetch batch data in chunks to avoid overwhelming the server
      setStatus('Fetching fund details...');
      setProgress(10);
      
      const batchSize = 15; // Process in batches to avoid overwhelming the server
      const allResults: any[] = [];
      
      for (let i = 0; i < popularFundCodes.length; i += batchSize) {
        if (!isMounted.current) return;
        
        const batch = popularFundCodes.slice(i, i + batchSize);
        const batchResponse = await fetch(
          `/api/funds/batch?codes=${batch.join(',')}`
        );
        
        if (!batchResponse.ok) {
          throw new Error(`Batch request failed with status ${batchResponse.status}`);
        }
        
        const batchData = await batchResponse.json();
        allResults.push(...batchData.funds);
        
        // Update progress
        const batchProgress = 10 + Math.round(((i + batch.length) / popularFundCodes.length) * 70);
        setProgress(Math.min(80, batchProgress));
        setStatus(`Processed ${Math.min(i + batch.length, popularFundCodes.length)}/${popularFundCodes.length} funds...`);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setProgress(85);
      setStatus('Organizing data by category...');
      
      // Step 3: Organize by category
      const organizedData: Record<string, FundData[]> = {};
      
      allResults.forEach((fund: any) => {
        if (fund.available && !fund.error) {
          const category = fund.category || 'Other';
          if (!organizedData[category]) {
            organizedData[category] = [];
          }
          
          organizedData[category].push({
            schemeCode: fund.schemeCode,
            schemeName: fund.schemeName,
            fundHouse: fund.fundHouse,
            nav: fund.latestNav ?? fund.nav,
            returns: {
              '1M': null, // Placeholder - would need additional API calls
              '3M': null,
              '6M': null,
              '1Y': fund.cagrReturns['1Y'],
              '3Y': fund.cagrReturns['3Y'],
              '5Y': fund.cagrReturns['5Y'],
              '10Y': null,
              'sinceInception': null
            },
            sinceInception: null
          });
        }
      });
      
      // Ensure all categories exist
      CATEGORIES.forEach(category => {
        if (!organizedData[category]) {
          organizedData[category] = [];
        }
      });
      
      setFundsData(organizedData);
      setProgress(100);
      setStatus('Done!');
    } catch (e: any) {
      console.error("Failed to fetch funds", e);
      setError(e.message || "We're having trouble loading fund data. Please try again later.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
        // Auto-hide success message after 2 seconds
        if (progress >= 100) {
          setTimeout(() => {
            if (isMounted.current) {
              setStatus('Ready!');
            }
          }, 2000);
        }
      }
    }
  };

  useEffect(() => {
    fetchFunds();
    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
  };

  const getReturnColor = (val: number | null) => {
    if (val === null) return 'text-slate-400';
    if (val >= 15) return 'text-emerald-600 font-bold';
    if (val >= 0) return 'text-amber-600';
    return 'text-rose-600 font-bold';
  };

  const formatReturn = (val: number | null | undefined) => {
    if (val == null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  if (loading || error) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
              <TrendingUp size={32} className="rotate-180" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Data fetch failed</h3>
            <p className="text-slate-500 max-w-md">{error}</p>
            <button 
              onClick={() => fetchFunds()} 
              className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Retry Now
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
              <ProgressCircle progress={progress} size={16} />
              <span>{status}</span>
            </div>
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
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-slate-50/30 min-h-screen">
      <FadeIn>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
              <TrendingUp size={16} />
              <span>Market Insights</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Top Performing Funds</h1>
            <p className="text-slate-500 max-w-2xl">
              Curated analysis of the highest CAGR returns across mutual fund categories. 
              Updated hourly from live NAV data.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="px-3 py-1 text-xs font-medium text-slate-400">Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>

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
              className="pl-10 rounded-full bg-white border-slate-200 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            {!loading && (
              <div className="flex items-center space-x-2">
                <div className="w-20">
                  <ProgressCircle progress={progress} size={20} />
                </div>
                <span className="text-xs text-muted-foreground">{status}</span>
              </div>
            )}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Award size={20} />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">Top Performer</Badge>
              </div>
              <div className="mt-8">
                <p className="text-blue-100 text-sm font-medium">Best Category Today</p>
                <h3 className="text-2xl font-bold">Small Cap</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="mt-8">
                <p className="text-slate-500 text-sm font-medium">Analyzed Schemes</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {Object.values(fundsData).flat().length} Analyzed
                </h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="mt-8">
                <p className="text-slate-500 text-sm font-medium">Data Source</p>
                <h3 className="text-2xl font-bold text-slate-900">mfapi.in Real-time</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Rank</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fund Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NAV</th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('1M')}>
                     1M {sortConfig.key === '1M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('3M')}>
                     3M {sortConfig.key === '3M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('6M')}>
                     6M {sortConfig.key === '6M' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('1Y')}>
                     1Y {sortConfig.key === '1Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('3Y')}>
                     3Y {sortConfig.key === '3Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('5Y')}>
                     5Y {sortConfig.key === '5Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                   <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('10Y')}>
                     10Y {sortConfig.key === '10Y' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                   </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('sinceInception')}>
                      Inception {sortConfig.key === 'sinceInception' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />)}
                    </th>
                </tr>
              </thead>
              <tbody>
                {currentFunds.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400 font-medium">
                      No funds matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  currentFunds.map((fund: any, idx: number) => (
                    <tr 
                      key={fund.schemeCode} 
                      onClick={() => router.push(`/funds/${fund.schemeCode}`)}
                      className="border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer group"
                    >
                      <td className="p-4 text-sm font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10">
                        #{idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{fund.schemeName}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">{fund.category}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-600">₹{fund.nav?.toFixed(2) ?? 'N/A'}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['1M'])}`}>{formatReturn(fund.returns['1M'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['3M'])}`}>{formatReturn(fund.returns['3M'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['6M'])}`}>{formatReturn(fund.returns['6M'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['1Y'])}`}>{formatReturn(fund.returns['1Y'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['3Y'])}`}>{formatReturn(fund.returns['3Y'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['5Y'])}`}>{formatReturn(fund.returns['5Y'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.returns['10Y'])}`}>{formatReturn(fund.returns['10Y'])}</td>
                      <td className={`p-4 text-sm font-mono ${getReturnColor(fund.sinceInception)}`}>{formatReturn(fund.sinceInception)}</td>
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