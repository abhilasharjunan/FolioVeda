"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  children?: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  loading,
  empty,
  emptyMessage = "No chart data available yet.",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("surface-card border-none shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-heading">{title}</CardTitle>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonChart height="h-64" />
        ) : empty ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
