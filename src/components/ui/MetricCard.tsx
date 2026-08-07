"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber, HoverLift } from "@/components/animations";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  hint?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: { value: number; label?: string } | null;
  className?: string;
  animate?: boolean;
};

export function MetricCard({
  label,
  value,
  icon,
  hint,
  prefix = "",
  suffix = "",
  decimals = 0,
  delta,
  className,
  animate = true,
}: MetricCardProps) {
  const numeric = typeof value === "number";
  const deltaPositive = delta != null && delta.value >= 0;

  return (
    <HoverLift>
      <Card className={cn("surface-card border-none shadow-sm", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
            {numeric && animate ? (
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            ) : (
              <span>
                {prefix}
                {value}
                {suffix}
              </span>
            )}
          </div>
          {delta != null && (
            <p
              className={cn(
                "mt-1 text-xs font-semibold",
                deltaPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {deltaPositive ? "+" : ""}
              {delta.value.toFixed(2)}
              {delta.label ? ` ${delta.label}` : ""}
            </p>
          )}
          {hint && !delta && (
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-400">{hint}</p>
          )}
        </CardContent>
      </Card>
    </HoverLift>
  );
}
