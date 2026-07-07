'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShieldCheck, ArrowUpRight, Info, User, Building2, Wallet, PieChart, Activity, RefreshCw } from 'lucide-react';
import { RiskOMeter } from '@/components/funds/RiskOMeter';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { ReturnsBarChart } from '@/components/funds/ReturnsBarChart';
import { ProgressCircle } from '@/components/ui/ProgressCircle';

export const dynamic = 'force-dynamic';

function formatReturn(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function FundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const loadFundDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setProgress(0);
        setStatus('Starting...');
        
        // Step 1: Get basic scheme info
        setStatus('Fetching basic information...');
        setProgress(10);
        
        // Try to get from cache first, then fall back to API
        let schemeData: any = null;
        try {
          // Try direct API call first for fastest response
          const schemeRes = await fetch(`/api/funds/${id}`);
          if (schemeRes.ok) {
            schemeData = await schemeRes.json();
          }
        } catch (e) {
          console.warn('Direct API failed, trying batch approach:', e);
        }
        
        if (!schemeData) {
          // Fallback to batch approach if direct fails
          const batchRes = await fetch(`/api/funds/batch?codes=${id}`);
          if (batchRes.ok) {
            const batchData = await batchRes.json();
            if (batchData.funds && batchData.funds.length > 0) {
              schemeData = batchData.funds[0];
            }
          }
        }
        
        if (!schemeData) {
          throw new Error('Unable to fetch fund data');
        }
        
        setProgress(30);
        setStatus('Processing basic data...');
        
        // Step 2: Get enhanced data if available
        setStatus('Loading enhanced data...');
        setProgress(40);
        
        // If we don't have full insights yet, try to get them
        let enhancedData: any = {};
        if (!schemeData.cagrReturns || !schemeData.sectorAllocation) {
          try {
            const insightsRes = await fetch(`/api/funds/${id}`);
            if (insightsRes.ok) {
              const insights = await insightsRes.json();
              // Merge enhanced data
              if (insights.cagrReturns) enhancedData.cagrReturns = insights.cagrReturns;
              if (insights.sectorAllocation) enhancedData.sectorAllocation = insights.sectorAllocation;
              if (insights.holdings) enhancedData.holdings = insights.holdings;
              if (insights.aum !== undefined) enhancedData.aum = insights.aum;
              if (insights.expenseRatio !== undefined) enhancedData.expenseRatio = insights.expenseRatio;
            }
          } catch (e) {
            console.warn('Could not fetch enhanced insights:', e);
            // Continue with basic data
          }
        }
        
        setProgress(70);
        setStatus('Calculating metrics...');
        
        // Merge data
        const finalData = {
          ...schemeData,
          ...enhancedData,
          // Ensure we have all required fields
          schemeCode: schemeData.schemeCode || id,
          schemeName: schemeData.schemeName || 'Unknown Fund',
          category: schemeData.category || 'Unknown',
          fundHouse: schemeData.fundHouse || 'N/A',
          latestNav: schemeData.latestNav || 0,
          lastUpdated: schemeData.lastUpdated || new Date().toISOString(),
          riskLevel: schemeData.riskLevel || 'Moderate',
          volatility: schemeData.volatility || 0,
          sharpeRatio: schemeData.sharpeRatio || 0,
          sortinoRatio: schemeData.sortinoRatio || 0,
          maxDrawdown: schemeData.maxDrawdown || 0,
          maxDrawdownDuration: schemeData.maxDrawdownDuration || 0,
           alpha: schemeData.alpha || 0,
           beta: schemeData.beta || 1,
           rSquared: schemeData.rSquared || 0,
           treynorRatio: schemeData.treynorRatio || 0,
          riskScore: schemeData.riskScore || 50,
          aum: schemeData.aum || 'N/A',
          expenseRatio: schemeData.expenseRatio || 'N/A',
          sectorAllocation: schemeData.sectorAllocation || {},
          holdings: schemeData.holdings || [],
          cagrReturns: schemeData.cagrReturns || { '1Y': null, '3Y': null, '5Y': null },
          fundManagerName: schemeData.fundManagerName || null,
          fundManagerTenure: schemeData.fundManagerTenure || null
        };
        
        setProgress(90);
        setStatus('Finalizing...');
        
        setAnalysis(finalData);
        setProgress(100);
        setStatus('Done!');
      } catch (err: any) {
        console.error('Error loading fund details:', err);
        setError(err.message || 'Failed to load fund details. Please try again.');
      } finally {
        if (progress >= 100) {
          setTimeout(() => {
            setStatus('Ready!');
          }, 1500);
        }
        setLoading(false);
      }
    };
    
    loadFundDetails();
  }, [id]);

  if (loading || error) {
    return (
      <div className="p-6 max-w-5xl mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        {error ? (
          <>
            <TrendingUp size={48} className="text-rose-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Error loading fund</h2>
            <p className="text-slate-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Refresh Page
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <div className="w-16">
                <ProgressCircle progress={progress} size={32} className="mr-2" />
              </div>
              <span className="text-sm text-muted-foreground">{status}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  const returns = analysis.cagrReturns;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <TrendingUp size={16} />
            <span>Fund Details</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{analysis.schemeName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono">{analysis.schemeCode}</Badge>
            <Badge variant="outline" className="text-[10px] text-slate-500">{analysis.category || 'General'}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Latest NAV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">₹{analysis.latestNav != null ? Number(analysis.latestNav).toFixed(2) : 'N/A'}</div>
            <p className="text-xs text-slate-400 mt-1">
              Updated: {new Date(analysis.lastUpdated).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.riskLevel ? (
              <RiskOMeter level={analysis.riskLevel as any} />
            ) : (
              <div className="text-sm text-slate-400">Not available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Fund Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                <User size={20} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">
                  {analysis.fundManagerName || 'Not Available'}
                </div>
                {analysis.fundManagerTenure && (
                  <p className="text-xs text-slate-500">Tenure: {analysis.fundManagerTenure}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Returns (CAGR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnsBarChart returns={analysis.cagrReturns} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">1 Year</p>
                <p className={`text-sm font-bold ${(returns['1Y'] ?? -1) >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                  {formatReturn(returns['1Y'])}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">3 Year</p>
                <p className={`text-sm font-bold ${(returns['3Y'] ?? -1) >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                  {formatReturn(returns['3Y'])}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">5 Year</p>
                <p className={`text-sm font-bold ${(returns['5Y'] ?? -1) >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                  {formatReturn(returns['5Y'])}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Fund Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs leading-relaxed">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                {analysis.fundHouse !== 'N/A' ? `Managed by ${analysis.fundHouse}.` : ''}
                This {analysis.category ? `${analysis.category} fund` : 'fund'} 
                invests in a diversified portfolio of securities.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-500">Fund House</span>
                </div>
                <span className="text-sm font-medium text-slate-800">{analysis.fundHouse}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-500">Expense Ratio</span>
                </div>
                <span className="text-sm font-medium text-slate-800">{analysis.expenseRatio}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-500">AUM</span>
                </div>
                <span className="text-sm font-medium text-slate-800">{analysis.aum}</span>
              </div>
              {analysis.riskScore && (
                <div className="flex justify-between items-center p-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-500">Risk Score</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{analysis.riskScore != null ? Number(analysis.riskScore).toFixed(1) : 'N/A'}/100</span>
                </div>
              )}
              {analysis.fundManagerName && (
                <div className="flex justify-between items-center p-3">
                   <div className="flex items-center gap-2">
                     <User size={14} className="text-slate-400" />
                     <span className="text-sm text-slate-500">Fund Manager</span>
                   </div>
                   <div className="text-right">
                     <span className="text-sm font-medium text-slate-800 block">{analysis.fundManagerName}</span>
                     {analysis.fundManagerTenure && (
                       <span className="text-[10px] text-slate-400">Tenure: {analysis.fundManagerTenure}</span>
                     )}
                   </div>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(analysis.sectorAllocation).length > 0 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-slate-400" />
              <CardTitle className="text-lg font-semibold">Sector Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <SectorPieChart data={analysis.sectorAllocation} />
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.holdings.length > 0 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              <CardTitle className="text-lg font-semibold">Top Holdings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sector</th>
                    <th className="p-3 text-xs font-sm text-slate-400 uppercase tracking-wider text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.holdings.map((h: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-slate-800">{h.stockName}</td>
                       <td className="p-3 text-sm text-slate-500">{h.sector}</td>
                       <td className="p-3 text-sm font-mono text-right text-slate-700">{h.allocation?.toFixed(2) ?? 'N/A'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}