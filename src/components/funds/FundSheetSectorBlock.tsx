"use client";

import React, { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#10b981",
  "#0d9488",
  "#f59e0b",
  "#ef4444",
  "#38bdf8",
  "#8b5cf6",
  "#64748b",
  "#14b8a6",
  "#94a3b8",
];

export function FundSheetSectorBlock({ data }: { data: Record<string, number> }) {
  const formattedData = useMemo(
    () =>
      Object.entries(data)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value),
    [data]
  );

  if (formattedData.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="h-[132px] w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={2}
              dataKey="value"
              stroke="transparent"
            >
              {formattedData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Weight"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "11px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-2.5">
        {formattedData.map((row, index) => (
          <li
            key={row.name}
            className="flex items-start gap-3 text-xs leading-snug"
          >
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              aria-hidden
            />
            <span
              className="min-w-0 flex-1 text-slate-700 dark:text-slate-200 break-words pr-2"
              title={row.name}
            >
              {row.name}
            </span>
            <span className="shrink-0 tabular-nums font-mono text-slate-600 dark:text-slate-300">
              {row.value.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
