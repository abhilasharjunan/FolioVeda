"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 font-heading">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5 bg-blue-600 hover:bg-blue-700 text-white" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
