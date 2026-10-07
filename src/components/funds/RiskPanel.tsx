"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/animations";
import { RiskOMeterInline } from "@/components/funds/RiskOMeterInline";
import { SectorPieChart } from "@/components/funds/SectorPieChart";
import { VolatilityChart } from "@/components/funds/VolatilityChart";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeletons";
import { downloadCSV } from "@/lib/export";
import { MetricLabel, METRIC_EXPLANATIONS } from "@/components/ui/InfoTooltip";
import { FundNameLink } from "@/components/funds/FundNameLink";
import { useOpenFundDetail } from "@/components/funds/FundDetailContext";
import type { FundCategory } from "@/lib/funds";
import type { MarketPanelHandle } from "@/components/funds/ReturnsPanel";

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

type RiskPanelProps = {
  activeCategory: FundCategory | "All";
  searchQuery: string;
};

export const RiskPanel = forwardRef<MarketPanelHandle, RiskPanelProps>(
  function RiskPanel({ activeCategory, searchQuery }, ref) {
    const openFund = useOpenFundDetail();
    const [data, setData] = useState<Record<string, FundRiskData[]> | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{
      key: string;
      direction: "asc" | "desc";
    }>({
      key: "compositeScore",
      direction: "desc",
    });
    const [selectedFund, setSelectedFund] = useState<FundRiskData | null>(null);

    useEffect(() => {
      async function fetchRiskData() {
        try {
          const res = await fetch("/api/funds/risk-analysis");
          const json = await res.json();
          if (!res.ok || json?.error) {
            console.error("Risk analysis unavailable:", json?.error || res.statusText);
            setData(null);
          } else {
            setData(json);
          }
        } catch (e) {
          console.error("Failed to fetch risk data", e);
          setData(null);
        } finally {
          setLoading(false);
        }
      }
      fetchRiskData();
    }, []);

    const currentFunds = useMemo(() => {
      if (!data) return [];
      const list: FundRiskData[] = [];
      Object.entries(data).forEach(([cat, funds]) => {
        funds.forEach((f) => {
          if (
            (activeCategory === "All" || cat === activeCategory) &&
            f.schemeName.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            list.push({ ...f, category: cat as FundCategory });
          }
        });
      });
      return list.sort((a, b) => {
        const aVal = a.metrics[sortConfig.key as keyof RiskMetrics] || 0;
        const bVal = b.metrics[sortConfig.key as keyof RiskMetrics] || 0;
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      });
    }, [data, activeCategory, searchQuery, sortConfig]);

    useImperativeHandle(ref, () => ({
      exportCsv: () => {
        const csvData = currentFunds.map((f) => ({
          "Scheme Name": f.schemeName,
          Category: f.category,
          "Risk Score": f.metrics.compositeScore.toFixed(2),
          Volatility: (f.metrics.volatility * 100).toFixed(2) + "%",
          "Sharpe Ratio": f.metrics.sharpeRatio.toFixed(2),
          "Sortino Ratio": f.metrics.sortinoRatio.toFixed(2),
          "Max DD": (f.metrics.maxDrawdown * 100).toFixed(2) + "%",
          "Max DD Duration (months)": f.metrics.maxDrawdownDuration,
          Alpha: (f.metrics.alpha * 100).toFixed(2) + "%",
          Beta: f.metrics.beta.toFixed(2),
          "R-Squared": (f.metrics.rSquared * 100).toFixed(2) + "%",
          "Treynor Ratio": f.metrics.treynorRatio.toFixed(2),
        }));
        downloadCSV(csvData, "fund-risk-analysis");
      },
    }));

    const getRiskColor = (score: number) => {
      if (score < 20) return "text-green-500";
      if (score < 40) return "text-green-400";
      if (score < 60) return "text-yellow-500";
      if (score < 80) return "text-orange-500";
      return "text-red-500";
    };

    if (loading) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
          <SkeletonChart height="h-[600px]" />
        </div>
      );
    }

    if (!data) {
      return (
        <Card className="surface-card border-none shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldAlert className="mx-auto text-rose-500" size={28} />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Risk metrics unavailable
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-300 max-w-md mx-auto">
              The risk cache is empty or the sync has not run yet. Trigger the weekly sync-risk
              cron, then refresh this page.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="surface-card border-none shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600 w-fit">
                <Activity size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
                  Market Volatility
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Moderate</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-card border-none shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600 w-fit">
                <Zap size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
                  Highest Risk Cat
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Small Cap</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="surface-card border-none shadow-sm">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="p-2 bg-blue-50 dark:bg-teal-950/40 rounded-lg text-blue-600 w-fit">
                <TrendingUp size={20} />
              </div>
              <div className="mt-8">
                <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
                  Total Schemes
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {Object.keys(data || {}).reduce(
                    (sum, cat) => sum + (data?.[cat]?.length || 0),
                    0
                  )}{" "}
                  Funds
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 surface-card border-none shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      Fund
                    </th>
                    <th
                      className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-rose-600"
                      onClick={() =>
                        setSortConfig({
                          key: "compositeScore",
                          direction:
                            sortConfig.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      <MetricLabel
                        label="Risk Score"
                        tooltip={METRIC_EXPLANATIONS.compositeScore}
                      />
                      {sortConfig.key === "compositeScore" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp size={12} className="inline ml-1" />
                        ) : (
                          <ChevronDown size={12} className="inline ml-1" />
                        ))}
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      <MetricLabel
                        label="Volatility"
                        tooltip={METRIC_EXPLANATIONS.volatility}
                      />
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      <MetricLabel label="Sharpe" tooltip={METRIC_EXPLANATIONS.sharpeRatio} />
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      <MetricLabel
                        label="Sortino"
                        tooltip={METRIC_EXPLANATIONS.sortinoRatio}
                      />
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      <MetricLabel
                        label="Max DD"
                        tooltip={METRIC_EXPLANATIONS.maxDrawdown}
                      />
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      DD Duration
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      Risk Bar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentFunds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center text-slate-400 font-medium"
                      >
                        No risk data available.
                      </td>
                    </tr>
                  ) : (
                    currentFunds.map((fund) => (
                      <tr
                        key={fund.schemeCode}
                        onClick={() => {
                          setSelectedFund(fund);
                          openFund(fund.schemeCode);
                        }}
                        className="border-b border-slate-50 dark:border-slate-800 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <FundNameLink
                                schemeCode={fund.schemeCode}
                                stopPropagation={false}
                              >
                                {fund.schemeName}
                              </FundNameLink>
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              {fund.category}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`p-4 text-sm font-mono font-bold ${getRiskColor(fund.metrics.compositeScore)}`}
                        >
                          {fund.metrics.compositeScore.toFixed(1)}
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                          {(fund.metrics.volatility * 100).toFixed(2)}%
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                          {fund.metrics.sharpeRatio.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                          {fund.metrics.sortinoRatio.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm font-mono text-rose-600">
                          {(fund.metrics.maxDrawdown * 100).toFixed(2)}%
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                          {fund.metrics.maxDrawdownDuration}mo
                        </td>
                        <td className="p-4">
                          <RiskOMeterInline
                            level={
                              fund.metrics.compositeScore < 20
                                ? "Low"
                                : fund.metrics.compositeScore < 40
                                  ? "Low to Moderate"
                                  : fund.metrics.compositeScore < 60
                                    ? "Moderate"
                                    : fund.metrics.compositeScore < 80
                                      ? "Moderate to High"
                                      : fund.metrics.compositeScore < 90
                                        ? "High"
                                        : "Very High"
                            }
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="surface-card border-none shadow-xl p-6 space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold">Risk Details</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              {!selectedFund ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
                  <ShieldAlert size={40} className="text-slate-300" />
                  <p className="text-sm text-slate-400">
                    Select a fund to view deep risk analysis
                  </p>
                </div>
              ) : (
                <FadeIn>
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                        <MetricLabel
                          label="Portfolio Concentration (HHI)"
                          tooltip={METRIC_EXPLANATIONS.concentrationRisk}
                        />
                      </h4>
                      <div className="flex items-end justify-between mb-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                          {selectedFund.metrics.concentrationRisk.toFixed(4)}
                        </span>
                        <span className="text-xs text-slate-500">Higher = More Concentrated</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(selectedFund.metrics.concentrationRisk * 1000, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase px-1">
                        Fund Manager
                      </h4>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              Name
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {selectedFund.fundManagerName || "Not Available"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              Tenure
                            </span>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {selectedFund.fundManagerTenure || "Not Available"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase px-1">
                        Sector Exposure
                      </h4>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <SectorPieChart
                          data={
                            selectedFund.metrics.sectorConcentration > 0
                              ? {
                                  "Top Sectors": selectedFund.metrics.sectorConcentration,
                                  Others: 100 - selectedFund.metrics.sectorConcentration,
                                }
                              : {}
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase px-1">
                        Volatility Trend (3Y)
                      </h4>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <VolatilityChart
                          data={[
                            { date: "2023", value: 0.12 },
                            { date: "2024", value: 0.15 },
                            { date: "2025", value: 0.11 },
                            { date: "2026", value: 0.14 },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          <MetricLabel
                            label="Sharpe Ratio"
                            tooltip={METRIC_EXPLANATIONS.sharpeRatio}
                          />
                        </p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {selectedFund.metrics.sharpeRatio.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          <MetricLabel
                            label="Max Drawdown"
                            tooltip={METRIC_EXPLANATIONS.maxDrawdown}
                          />
                        </p>
                        <p className="text-lg font-bold text-rose-600">
                          {(selectedFund.metrics.maxDrawdown * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);
