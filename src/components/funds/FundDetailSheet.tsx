"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, TrendingUp, User, Building2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FundSheetSectorBlock } from "@/components/funds/FundSheetSectorBlock";
import { formatCacheTimestamp, formatFactsheetAsOf } from "@/lib/format-holdings-date";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  holdingsCount?: number;
  sectorAllocation: Record<string, number>;
  asOfDate: string | null;
  holdingsCachedAt?: string | null;
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
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

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
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [schemeCode, onClose]);

  if (!schemeCode) return null;

  const hasSectors = data && Object.keys(data.sectorAllocation || {}).length > 0;
  const hasHoldings = data && data.holdings?.length > 0;
  const hasManager = !!(data?.fundManager && (data.fundManager.history || data.fundManager.tenure || data.fundManager.name));
  const hasComparison = data && data.comparison?.length > 0;
  const titleId = "fund-detail-sheet-title";

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-label="Close fund details"
        onClick={onClose}
        tabIndex={-1}
      />
      <aside
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <TrendingUp size={12} /> Fund details
            </p>
            <h2
              id={titleId}
              className="text-base font-bold text-slate-900 dark:text-slate-50 font-heading leading-snug mt-0.5 line-clamp-2 pr-1"
            >
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
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center size-10 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-7">
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
              <div className="grid grid-cols-2 gap-3">
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
                <section className="space-y-2.5">
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
                    Returns vs Nifty 50
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Compared with {data.benchmark.schemeName}. Alpha = fund − index.
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs table-fixed min-w-[280px]">
                      <colgroup>
                        <col className="w-[22%]" />
                        <col className="w-[26%]" />
                        <col className="w-[26%]" />
                        <col className="w-[26%]" />
                      </colgroup>
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr>
                          <th className="px-2.5 py-2.5 font-semibold text-slate-500">Period</th>
                          <th className="px-2 py-2.5 font-semibold text-slate-500 text-right">Fund</th>
                          <th className="px-2 py-2.5 font-semibold text-slate-500 text-right">Nifty</th>
                          <th className="px-2 py-2.5 font-semibold text-slate-500 text-right">Alpha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.comparison.map((row) => (
                          <tr
                            key={row.period}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="px-2.5 py-2 font-medium text-slate-700 dark:text-slate-200">
                              {row.period}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono tabular-nums ${returnClass(row.fund)}`}>
                              {formatReturn(row.fund)}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono tabular-nums ${returnClass(row.nifty50)}`}>
                              {formatReturn(row.nifty50)}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono tabular-nums ${returnClass(row.alpha)}`}>
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
                <section className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
                  <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
                    Sector allocation
                  </h3>
                  <FundSheetSectorBlock data={data.sectorAllocation} />
                </section>
              )}

              {hasHoldings && (
                <section className="space-y-2.5">
                  <div>
                    <h3 className="text-sm font-semibold font-heading text-slate-900 dark:text-slate-50">
                      Top stock holdings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed space-y-1">
                      <span className="block">
                        {data.holdingsCount != null && data.holdingsCount > data.holdings.length
                          ? `Top ${data.holdings.length} of ${data.holdingsCount} names from the stored factsheet (monthly AMC disclosure).`
                          : `Top ${data.holdings.length} by weight from the stored factsheet (monthly AMC disclosure).`}
                      </span>
                      {formatFactsheetAsOf(data.asOfDate) && (
                        <span className="block text-slate-600 dark:text-slate-300">
                          Portfolio disclosed as of{" "}
                          <span className="font-medium">{formatFactsheetAsOf(data.asOfDate)}</span>
                          {" — "}
                          weights are not live; many funds share the same month when data was bulk-synced.
                        </span>
                      )}
                      {formatCacheTimestamp(data.holdingsCachedAt) && (
                        <span className="block text-slate-400 dark:text-slate-500">
                          Snapshot loaded in FolioVeda on {formatCacheTimestamp(data.holdingsCachedAt)}.
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs table-fixed">
                      <colgroup>
                        <col className="w-[46%]" />
                        <col className="w-[34%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead className="bg-slate-50 dark:bg-slate-900/80">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold text-slate-500 align-bottom">Stock</th>
                          <th className="px-2 py-2.5 font-semibold text-slate-500 align-bottom">Sector</th>
                          <th className="px-3 py-2.5 font-semibold text-slate-500 text-right align-bottom">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.holdings.map((h, i) => (
                          <tr
                            key={`${h.stockName}-${i}`}
                            className="border-t border-slate-100 dark:border-slate-800 align-top"
                          >
                            <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100 leading-snug">
                              <span className="line-clamp-2 break-words" title={h.stockName}>
                                {h.stockName}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-slate-500 leading-snug">
                              <span className="line-clamp-2 break-words" title={h.sector}>
                                {h.sector}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
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
