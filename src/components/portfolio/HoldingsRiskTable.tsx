"use client";

import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SortableTh } from "@/components/ui/SortableTh";
import { FundNameLink } from "@/components/funds/FundNameLink";
import { useTableSort } from "@/hooks/useTableSort";
import { compareSortValues } from "@/lib/table-sort";

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

const COLUMNS: { key: SortKey; label: string; text?: boolean }[] = [
  { key: "fund", label: "Fund", text: true },
  { key: "weight", label: "Weight" },
  { key: "value", label: "Value" },
  { key: "volatility", label: "Volatility" },
  { key: "score", label: "Score" },
];

export function HoldingsRiskTable({
  holdings,
  totalValue,
}: {
  holdings: HoldingRisk[];
  totalValue: number;
}) {
  const { sortKey, sortDir, toggle } = useTableSort<SortKey>("value", "desc");

  const sorted = useMemo(() => {
    const valueOf = (h: HoldingRisk) => {
      switch (sortKey) {
        case "fund":
          return h.schemeName;
        case "weight":
        case "value":
          return h.currentValue;
        case "volatility":
          return h.volatility;
        case "score":
          return h.riskScore;
      }
    };
    return [...holdings].sort((a, b) => compareSortValues(valueOf(a), valueOf(b), sortDir));
  }, [holdings, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <tr>
            {COLUMNS.map((col) => (
              <SortableTh
                key={col.key}
                label={col.label}
                active={col.key === sortKey}
                direction={sortDir}
                onClick={() => toggle(col.key, { text: col.text })}
              />
            ))}
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
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase">
                    {h.category}
                  </span>
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
