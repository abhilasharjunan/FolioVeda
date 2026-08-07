"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { RiskOMeterInline } from '@/components/funds/RiskOMeterInline';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { ReturnsBarChart } from '@/components/funds/ReturnsBarChart';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressCircle } from '@/components/ui/ProgressCircle';
import { createProgressTracker } from '@/lib/progressTracker';
import { TrendingUp, Search, X, Loader2, BarChart3, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/export';

interface FundCardData {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  aum: string;
  expenseRatio: string;
  sectorAllocation: Record<string, number>;
  riskMetrics: { compositeScore: number } | null;
  cagrReturns: Record<string, number | null>;
}

export default function FundComparePage() {
  const [comparisonList, setComparisonList] = useState<FundCardData[]>([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ schemeName: string; schemeCode: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const progressTrackerRef = useRef<ReturnType<typeof createProgressTracker>>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
          const results = await res.json();
          setSuggestions(results);
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addFundToCompare = async (schemeCode: string) => {
    if (comparisonList.find(f => f.schemeCode === schemeCode)) return;
    setSuggestions([]);
    setQuery('');
    setError(null);
    setIsLoadingBatch(true);

    const newCodes = [schemeCode, ...comparisonList.map(f => f.schemeCode)];
    setProgress(10);
    progressTrackerRef.current = createProgressTracker(3, setProgress);

    try {
      const batchRes = await fetch(`/api/funds/batch?codes=${newCodes.join(',')}`);
      progressTrackerRef.current.increment();
      if (!batchRes.ok) {
        const errBody = await batchRes.json().catch(() => ({ error: 'Unknown error' }));
        setError(errBody.error || `Failed to load funds (${batchRes.status})`);
        setIsLoadingBatch(false);
        return;
      }
      const batchData = await batchRes.json();
      progressTrackerRef.current.increment();

      const newList = batchData.funds.map((f: any) => ({
        schemeCode: f.schemeCode,
        schemeName: f.schemeName,
        fundHouse: f.fundHouse || 'N/A',
        aum: f.aum || 'N/A',
        expenseRatio: f.expenseRatio || 'N/A',
        sectorAllocation: f.sectorAllocation || {},
        riskMetrics: f.riskScore != null ? { compositeScore: f.riskScore } : null,
        cagrReturns: f.cagrReturns || {},
      }));
      progressTrackerRef.current.increment();
      setComparisonList(newList);
    } catch (e) {
      setError('Network error — unable to reach server');
      console.error("Error adding fund", e);
    } finally {
      setIsLoadingBatch(false);
      setProgress(0);
    }
  };

  const removeFund = (code: string) => {
    setComparisonList(prev => prev.filter(f => f.schemeCode !== code));
  };

  const getRiskLevel = (score: number | null | undefined): 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderate to High' | 'High' | 'Very High' => {
    if (score == null) return 'Moderate';
    if (score < 20) return 'Low';
    if (score < 40) return 'Low to Moderate';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'Moderate to High';
    if (score < 90) return 'High';
    return 'Very High';
  };

  const best3Y = comparisonList.reduce<{ code: string; value: number } | null>((best, f) => {
    const v = f.cagrReturns['3Y'];
    if (v == null) return best;
    if (!best || v > best.value) return { code: f.schemeCode, value: v };
    return best;
  }, null);

  const lowestExpense = comparisonList.reduce<{ code: string; value: number } | null>((best, f) => {
    const raw = parseFloat(String(f.expenseRatio).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(raw)) return best;
    if (!best || raw < best.value) return { code: f.schemeCode, value: raw };
    return best;
  }, null);

  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto min-h-screen">
      <FadeIn>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
              <TrendingUp size={16} />
              <span>Analysis Suite</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight font-heading">Fund Comparison</h1>
            <p className="text-slate-500 dark:text-slate-300 max-w-2xl">
              Contrast performance, risk profiles, and portfolio structures of multiple funds side-by-side.
            </p>
          </div>
          {comparisonList.length > 0 && (
            <button
              onClick={() => {
                const csvData = comparisonList.map(f => ({
                  'Fund Name': f.schemeName,
                  'Fund House': f.fundHouse,
                  'AUM': f.aum,
                  'Expense Ratio': f.expenseRatio,
                  'Risk Score': f.riskMetrics?.compositeScore?.toFixed(1) ?? 'N/A',
                  '1Y CAGR': f.cagrReturns['1Y'] != null ? `${f.cagrReturns['1Y']}%` : 'N/A',
                  '3Y CAGR': f.cagrReturns['3Y'] != null ? `${f.cagrReturns['3Y']}%` : 'N/A',
                  '5Y CAGR': f.cagrReturns['5Y'] != null ? `${f.cagrReturns['5Y']}%` : 'N/A',
                  'Top Sector': Object.entries(f.sectorAllocation).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
                }));
                downloadCSV(csvData, 'fund-comparison');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </header>

        <div className="relative max-w-xl" ref={dropdownRef}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" size={16} />
            <Input 
              placeholder="Search mutual funds to compare..." 
              className="pl-10 pr-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isSearching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 animate-spin" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              {suggestions.map(fund => {
                const isSelected = comparisonList.some(f => f.schemeCode === fund.schemeCode);
                return (
                  <div 
                    key={fund.schemeCode}
                    onClick={() => !isSelected && !isLoadingBatch && addFundToCompare(fund.schemeCode)}
                    className={`p-3 flex justify-between items-center border-b border-slate-50 dark:border-slate-800 last:border-none ${
                      isSelected 
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 cursor-not-allowed' 
                        : isLoadingBatch
                          ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 cursor-wait'
                          : 'hover:bg-blue-50 dark:hover:bg-teal-950/40 cursor-pointer text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-medium">{fund.schemeName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono">{fund.schemeCode}</Badge>
                      {isSelected && <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">Added</Badge>}
                      {isLoadingBatch && <Loader2 size={14} className="animate-spin text-slate-400 dark:text-slate-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
        </div>

        {isLoadingBatch && (
          <div className="space-y-2 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-3">
              <ProgressCircle progress={progress} size={48} />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Loading fund data...</p>
                <ProgressBar progress={progress} showLabel={false} />
              </div>
            </div>
          </div>
        )}

        {comparisonList.length > 1 && (
          <Card className="surface-card border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50 font-heading">Returns Comparison (CAGR Overlay)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ReturnsBarChart
                overlay
                funds={comparisonList.map(f => ({
                  name: f.schemeName,
                  returns: f.cagrReturns,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {comparisonList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 surface-card rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-400">
              <Search size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-heading">No funds selected</h3>
              <p className="text-slate-500 dark:text-slate-300">Search for funds above to begin a side-by-side comparison.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonList.map((fund) => {
              const isBestReturn = best3Y?.code === fund.schemeCode;
              const isLowestExpense = lowestExpense?.code === fund.schemeCode;
              return (
              <Card key={fund.schemeCode} className={`surface-card border-none shadow-lg overflow-hidden ${isBestReturn ? 'ring-2 ring-emerald-400/70' : ''}`}>
                <CardHeader className="relative bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => removeFund(fund.schemeCode)}
                    className="absolute right-4 top-4 p-1 text-slate-400 dark:text-slate-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex flex-wrap gap-1 mb-2 pr-6">
                    {isBestReturn && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Best 3Y</Badge>}
                    {isLowestExpense && <Badge className="bg-blue-50 dark:bg-teal-950/40 text-blue-700 border-blue-200 text-[10px]">Lowest expense</Badge>}
                  </div>
                  <CardTitle className="text-md font-bold text-slate-900 dark:text-slate-50 pr-6 line-clamp-2 font-heading">
                    {fund.schemeName}
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">{fund.fundHouse}</p>
                </CardHeader>
                <CardContent className="px-4 py-6 sm:p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold">AUM</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fund.aum}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold">Expense Ratio</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fund.expenseRatio}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-300">Risk Profile</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fund.riskMetrics?.compositeScore?.toFixed(1) ?? 'N/A'}</span>
                    </div>
                    <RiskOMeterInline level={getRiskLevel(fund.riskMetrics?.compositeScore)} />
                  </div>

                  <div className="space-y-3">
                     <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase">Returns (CAGR)</h4>
                     <ReturnsBarChart returns={fund.cagrReturns} />
                   </div>

                   <div className="space-y-3">
                     <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase">Sector Allocation</h4>
                     <div className="h-[200px]">
                       <SectorPieChart data={fund.sectorAllocation || {}} />
                     </div>
                   </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
