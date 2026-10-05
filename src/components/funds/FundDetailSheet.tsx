"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, TrendingUp, User, Building2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectorPieChart } from "@/components/funds/SectorPieChart";

type FundDetail = {
  schemeCode: string;
  schemeName: string;
  category: string | null;
  fundHouse: string;
  latestNav: number | null;
  lastUpdated: string | null;
  riskLevel: string | null;
  aum: string;
  expenseRatio: string;
  fundManager: {
    name: string;
    tenure: string | null;
    experience: string | null;
    history: string | null;
  } | null;
  holdings: Array<{ stockName: string; sector: string; allocation: number }>;
  sectorAllocation: Record<string, number>;
  asOfDate: string | null;
  periodReturns: Record<string, number | null>;
  sinceInception: number | null;
  benchmark: { schemeName: string };
  comparison: Array<{
    period: string;
    fund: number | null;
    nifty50: number | null;
    alpha: number | null;
  }>;
};

function formatReturn(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function returnClass(value: number | null | undefined): string {
  if (value == null) return "text-slate-400";
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
}

export function FundDetailSheet({
  schemeCode,
  onClose,
}: {
  schemeCode: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<FundDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeCode) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(`/api/funds/${encodeURIComponent(schemeCode)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load fund");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load fund");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [schemeCode]);

  useEffect(() => {
    if (!schemeCode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [schemeCode, onClose]);

  if (!schemeCode) return null;

  const hasSectors = data && Object.keys(data.sectorAllocation || {}).length > 0;
  const hasHoldings = data && data.holdings?.length > 0;
  const hasManager = !!(data?.fundManager && (data.fundManager.history || data.fundManager.tenure || data.fundManager.name));
  const hasComparison = data && data.comparison?.length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-label="Close fund details"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <TrendingUp size={12} /> Fund details
            </p>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 font-heading leading-snug mt-0.5 truncate">
              {data?.schemeName || (loading ? "Loading…" : "Fund")}
            </h2>
            {data && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {data.schemeCode}
                </Badge>
                {data.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {data.category}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
              <Loader2 className="animate-spin" size={18} /> Loading fund…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {data && !loading && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">NAV</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-50 font-heading">
                    {data.latestNav != null ? `₹${Number(data.latestNav).toFixed(2)}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Fund house</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                    <Building2 size={12} className="text-slate-400 shrink-0" />
                    {data.fundHouse}
                  </p>
                </div>
                {data.expenseRatio && data.expenseRatio !== "N/A" && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Expense ratio</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {data.expenseRatio}
                    </p>
                  </div>
                )}
                {data.aum && data.aum !== "N/A" && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">AUM</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.aum}</p>
                  </div>
                )}
                {data.riskLevel && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 col-span-2">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Risk</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {data.riskLevel}
                    </p>
                  </div>
                )}
              </div>

              {hasComparison && (
                <section>
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50 mb-2">
                    Returns vs Nifty 50
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Compared with {data.benchmark.schemeName}. Alpha = fund − index.
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr>
                          <th className="p-2 font-semibold text-slate-500">Period</th>
                          <th className="p-2 font-semibold text-slate-500 text-right">Fund</th>
                          <th className="p-2 font-semibold text-slate-500 text-right">Nifty 50</th>
                          <th className="p-2 font-semibold text-slate-500 text-right">Alpha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.comparison.map((row) => (
                          <tr
                            key={row.period}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="p-2 font-medium text-slate-700 dark:text-slate-200">
                              {row.period}
                            </td>
                            <td className={`p-2 text-right font-mono ${returnClass(row.fund)}`}>
                              {formatReturn(row.fund)}
                            </td>
                            <td className={`p-2 text-right font-mono ${returnClass(row.nifty50)}`}>
                              {formatReturn(row.nifty50)}
                            </td>
                            <td className={`p-2 text-right font-mono ${returnClass(row.alpha)}`}>
                              {formatReturn(row.alpha)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {hasManager && data.fundManager && (
                <section className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-2">
                    <User size={14} className="text-teal-600 dark:text-teal-400" />
                    Fund manager
                  </h3>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {data.fundManager.name}
                  </p>
                  {data.fundManager.tenure && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tenure: {data.fundManager.tenure}
                    </p>
                  )}
                  {data.fundManager.history && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {data.fundManager.history}
                    </p>
                  )}
                </section>
              )}

              {hasSectors && (
                <section>
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50 mb-2">
                    Sector allocation
                  </h3>
                  <div className="h-[220px]">
                    <SectorPieChart data={data.sectorAllocation} />
                  </div>
                </section>
              )}

              {hasHoldings && (
                <section>
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50 mb-1">
                    Stock holdings
                  </h3>
                  {data.asOfDate && (
                    <p className="text-[11px] text-slate-400 mb-2">As of {data.asOfDate}</p>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr>
                          <th className="p-2 font-semibold text-slate-500">Stock</th>
                          <th className="p-2 font-semibold text-slate-500">Sector</th>
                          <th className="p-2 font-semibold text-slate-500 text-right">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.holdings.map((h, i) => (
                          <tr
                            key={`${h.stockName}-${i}`}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="p-2 font-medium text-slate-800 dark:text-slate-100">
                              {h.stockName}
                            </td>
                            <td className="p-2 text-slate-500">{h.sector}</td>
                            <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-200">
                              {h.allocation.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
