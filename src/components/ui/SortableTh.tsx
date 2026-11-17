"use client";

import React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "@/lib/table-sort";

type SortableThProps = {
  label: React.ReactNode;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
  sticky?: boolean;
};

export function SortableTh({
  label,
  active,
  direction,
  onClick,
  align = "left",
  className = "",
  sticky = false,
}: SortableThProps) {
  return (
    <th
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={`p-0 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider ${
        sticky ? "sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/50" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-1.5 p-4 transition-colors hover:text-slate-800 dark:hover:text-slate-100 ${
          align === "right" ? "justify-end" : ""
        } ${active ? "text-slate-800 dark:text-slate-100" : ""}`}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ArrowUp size={12} aria-hidden />
          ) : (
            <ArrowDown size={12} aria-hidden />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}
