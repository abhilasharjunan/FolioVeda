'use client';
import React from 'react';

interface FundReturns {
  name: string;
  returns: Record<string, number | null>;
}

interface ReturnsBarChartProps {
  returns?: Record<string, number | null>;
  funds?: FundReturns[];
  overlay?: boolean;
}

const periodLabels: Record<string, string> = {
  '1Y': '1 Year',
  '3Y': '3 Years',
  '5Y': '5 Years',
};

const periodOrder = ['1Y', '3Y', '5Y'];

const fundColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function SingleFundChart({ returns }: { returns: Record<string, number | null> }) {
  const values = periodOrder.map((p) => returns[p]).filter((v): v is number => v !== null);
  const absMax = values.length > 0
    ? Math.max(...values.map((v) => Math.abs(v)), 0.1)
    : 0.1;

  return (
    <div className="space-y-3">
      {periodOrder.map((period) => {
        const value = returns[period];
        const isPositive = value !== null && value >= 0;
        const pct = value !== null ? (Math.abs(value) / absMax) * 100 : 0;

        return (
          <div key={period} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-300">{periodLabels[period]}</span>
              <span className={`font-bold ${
                value === null ? 'text-slate-400 dark:text-slate-400' : isPositive ? 'text-green-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {value !== null ? `${isPositive ? '+' : ''}${value.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-700 absolute top-0 ${
                  value === null
                    ? 'bg-slate-200 dark:bg-slate-600 w-0'
                    : isPositive
                      ? 'bg-green-500 left-0'
                      : 'bg-rose-500 right-0'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverlayChart({ funds }: { funds: FundReturns[] }) {
  const allValues = funds.flatMap(f => periodOrder.map(p => f.returns[p]).filter((v): v is number => v !== null));
  const absMax = allValues.length > 0 ? Math.max(...allValues.map(v => Math.abs(v)), 0.1) : 0.1;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        {funds.map((f, i) => (
          <div key={f.name} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: fundColors[i % fundColors.length] }} />
            <span className="font-medium truncate max-w-[120px]">{f.name.split(' ').slice(0, 3).join(' ')}</span>
          </div>
        ))}
      </div>

      {periodOrder.map((period) => {
        const hasData = funds.some(f => f.returns[period] !== null);
        if (!hasData) return null;

        const groupMax = Math.max(
          ...funds.map(f => Math.abs(f.returns[period] ?? 0)),
          0.1
        );

        return (
          <div key={period} className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{periodLabels[period]}</p>
            <div className="space-y-1.5">
              {funds.map((f, i) => {
                const value = f.returns[period];
                const isPositive = value !== null && value >= 0;
                const pct = value !== null ? (Math.abs(value) / groupMax) * 100 : 0;
                const color = fundColors[i % fundColors.length];

                return (
                  <div key={f.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 w-16 truncate">{f.name.split(' ').slice(0, 2).join(' ')}</span>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 absolute top-0 ${
                          value === null ? 'bg-slate-200 dark:bg-slate-600 w-0' : isPositive ? 'left-0' : 'right-0'
                        }`}
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-12 text-right ${
                      value === null ? 'text-slate-400 dark:text-slate-400' : isPositive ? 'text-green-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {value !== null ? `${isPositive ? '+' : ''}${value.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReturnsBarChart(props: ReturnsBarChartProps) {
  if (props.overlay && props.funds && props.funds.length > 0) {
    return <OverlayChart funds={props.funds} />;
  }

  if (props.returns) {
    return <SingleFundChart returns={props.returns} />;
  }

  return null;
}
