"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FundNameLink } from "@/components/funds/FundNameLink";

export interface HoldingRisk {
  schemeName: string;
  schemeCode: string;
  category: string | null;
  currentValue: number;
  volatility: number;
  riskScore: number;
  riskLevel: string;
}

type SortKey = "fund" | "weight" | "value" | "volatility" | "score";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "fund", label: "Fund", numeric: false },
  { key: "weight", label: "Weight", numeric: true },
  { key: "value", label: "Value", numeric: true },
  { key: "volatility", label: "Volatility", numeric: true },
  { key: "score", label: "Score", numeric: true },
];

export function HoldingsRiskTable({
  holdings,
  totalValue,
}: {
  holdings: HoldingRisk[];
  totalValue: number;
}) {
  // Default: largest position first — the same order the page rendered before.
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Names read best A→Z, numbers most-interesting-first.
      setSortDir(key === "fund" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const value = (h: HoldingRisk): number | string => {
      switch (sortKey) {
        case "fund":
          return h.schemeName.toLowerCase();
        case "weight":
        case "value":
          return h.currentValue;
        case "volatility":
          return h.volatility;
        case "score":
          return h.riskScore;
      }
    };
    return [...holdings].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) - (bv as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [holdings, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <tr>
            {COLUMNS.map((col) => {
              const active = col.key === sortKey;
              return (
                <th
                  key={col.key}
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="p-0 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                >
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className={`flex w-full items-center gap-1.5 p-4 transition-colors hover:text-slate-800 dark:hover:text-slate-100 ${
                      col.numeric ? "justify-start" : ""
                    } ${active ? "text-slate-800 dark:text-slate-100" : ""}`}
                  >
                    {col.label}
                    {active ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ChevronsUpDown size={12} className="opacity-40" />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => (
            <tr
              key={h.schemeCode}
              className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 transition-colors"
            >
              <td className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <FundNameLink schemeCode={h.schemeCode}>{h.schemeName}</FundNameLink>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase">{h.category}</span>
                </div>
              </td>
              <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                {totalValue > 0 ? ((h.currentValue / totalValue) * 100).toFixed(2) : "0.00"}%
              </td>
              <td className="p-4 text-sm font-mono text-slate-800 dark:text-slate-100 font-medium">
                ₹{h.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </td>
              <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                {(h.volatility * 100).toFixed(2)}%
              </td>
              <td className="p-4">
                <Badge variant="outline" className="text-slate-700 dark:text-slate-200 font-bold">
                  {h.riskScore.toFixed(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
