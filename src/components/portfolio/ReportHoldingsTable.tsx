"use client";

import React, { useMemo } from "react";
import { ReportFundCell } from "@/components/portfolio/ReportFundCell";
import { SortableTh } from "@/components/ui/SortableTh";
import { useTableSort } from "@/hooks/useTableSort";
import { compareSortValues } from "@/lib/table-sort";

export type ReportHoldingRow = {
  schemeCode: string;
  schemeName: string;
  invested: number;
  currentVal: number;
  gain: number;
  xirr: number | null;
};

type SortKey = "schemeName" | "invested" | "currentVal" | "gain" | "xirr";

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function ReportHoldingsTable({ holdings }: { holdings: ReportHoldingRow[] }) {
  const { sortKey, sortDir, toggle } = useTableSort<SortKey>("currentVal", "desc");

  const sorted = useMemo(() => {
    const valueOf = (h: ReportHoldingRow) => {
      switch (sortKey) {
        case "schemeName":
          return h.schemeName;
        case "invested":
          return h.invested;
        case "currentVal":
          return h.currentVal;
        case "gain":
          return h.gain;
        case "xirr":
          return h.xirr;
      }
    };
    return [...holdings].sort((a, b) => compareSortValues(valueOf(a), valueOf(b), sortDir));
  }, [holdings, sortKey, sortDir]);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-200 dark:border-slate-700">
          <SortableTh
            label="Fund"
            active={sortKey === "schemeName"}
            direction={sortDir}
            onClick={() => toggle("schemeName", { text: true })}
            className="print:pointer-events-none"
          />
          <SortableTh
            label="Invested"
            active={sortKey === "invested"}
            direction={sortDir}
            onClick={() => toggle("invested")}
            align="right"
            className="print:pointer-events-none"
          />
          <SortableTh
            label="Current Value"
            active={sortKey === "currentVal"}
            direction={sortDir}
            onClick={() => toggle("currentVal")}
            align="right"
            className="print:pointer-events-none"
          />
          <SortableTh
            label="Gain"
            active={sortKey === "gain"}
            direction={sortDir}
            onClick={() => toggle("gain")}
            align="right"
            className="print:pointer-events-none"
          />
          <SortableTh
            label="XIRR"
            active={sortKey === "xirr"}
            direction={sortDir}
            onClick={() => toggle("xirr")}
            align="right"
            className="print:pointer-events-none"
          />
        </tr>
      </thead>
      <tbody>
        {sorted.map((h, i) => (
          <tr key={`${h.schemeCode}-${i}`} className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-2 px-4 text-slate-800 dark:text-slate-100">
              <ReportFundCell schemeCode={h.schemeCode} schemeName={h.schemeName} />
            </td>
            <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-200">
              {fmtCurrency(h.invested)}
            </td>
            <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-200">
              {fmtCurrency(h.currentVal)}
            </td>
            <td
              className={`py-2 px-4 text-right font-mono ${
                h.gain >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {fmtCurrency(h.gain)}
            </td>
            <td
              className={`py-2 px-4 text-right font-mono font-bold ${
                h.xirr == null
                  ? "text-slate-400 dark:text-slate-400"
                  : h.xirr >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {h.xirr != null ? `${h.xirr.toFixed(2)}%` : "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
