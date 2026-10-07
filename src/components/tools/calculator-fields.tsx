"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function fmtCompact(n: number): string {
  if (!isFinite(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return fmtCurrency(n);
}

export function formatAnimatedCurrency(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
  return Math.round(n).toLocaleString("en-IN");
}

/** CVD-safe categorical palette for scenario charts (marks/swatches only). */
export const SCENARIO_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] as const;
export const SWP_SCENARIO_COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"] as const;

export type ChipAccent = "teal" | "indigo";

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
  id?: string;
}) {
  const fieldId = id ?? `number-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</label>
      <div className="relative">
        <Input
          id={fieldId}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  formatValue,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  id?: string;
}) {
  const fieldId = id ?? `slider-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-xs font-medium text-slate-500 dark:text-slate-300">{label}</label>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
          {formatValue ? formatValue(value) : value}
          {suffix}
        </span>
      </div>
      <Slider
        id={fieldId}
        value={[Number.isFinite(value) ? value : 0]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

const chipActive: Record<ChipAccent, string> = {
  indigo: "bg-teal-600 border-teal-600 text-white",
  teal: "bg-teal-600 border-teal-600 text-white",
};

const chipIdle: Record<ChipAccent, string> = {
  indigo:
    "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600",
  teal:
    "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600",
};

export function PresetChips({
  options,
  value,
  onSelect,
  format,
  accent = "teal",
}: {
  options: number[];
  value: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
  accent?: ChipAccent;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
            value === opt ? chipActive[accent] : chipIdle[accent]
          )}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-900 dark:text-slate-50";
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-4">
        <p className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold tracking-wide">
          {label}
        </p>
        <p className={`text-xl font-bold mt-0.5 tabular-nums ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
