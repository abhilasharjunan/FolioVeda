"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/animations";
import {
  LANDING_MOCK_COMPARE,
  LANDING_MOCK_DASHBOARD,
  LANDING_MOCK_OVERLAP,
  type LandingFeatureSceneId,
} from "@/lib/landing-feature-scenes";

function formatInr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function MockChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/80 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/80 bg-slate-900/60">
        <span className="size-2 rounded-full bg-rose-500/80" />
        <span className="size-2 rounded-full bg-amber-500/80" />
        <span className="size-2 rounded-full bg-emerald-500/80" />
        <span className="ml-2 text-[10px] font-medium text-slate-500 truncate">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function FeatureSceneVisual({ id }: { id: LandingFeatureSceneId }) {
  switch (id) {
    case "dashboard":
      return (
        <MockChrome title="Dashboard · Portfolio Overview">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Value</p>
              <p className="text-lg font-bold text-slate-50 tabular-nums">
                ₹<AnimatedNumber value={LANDING_MOCK_DASHBOARD.portfolioValue} format={formatInr} duration={0.5} />
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">XIRR</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                <AnimatedNumber value={LANDING_MOCK_DASHBOARD.xirr} decimals={1} suffix="%" duration={0.45} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-teal-500/20 bg-teal-950/30 p-3">
            <div
              className="relative size-12 rounded-full border-2 border-teal-500/40 flex items-center justify-center"
              aria-hidden
            >
              <span className="text-xs font-bold text-teal-300">{LANDING_MOCK_DASHBOARD.healthScore}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Portfolio health</p>
              <p className="text-[11px] text-slate-400">Allocation & diversification score</p>
            </div>
          </div>
        </MockChrome>
      );
    case "overlap":
      return (
        <MockChrome title="Overlap · Look-through">
          <p className="text-xs text-slate-400 mb-3">Pairwise fund overlap (illustrative)</p>
          <div className="space-y-2">
            {LANDING_MOCK_OVERLAP.pairs.map((p) => (
              <div key={p.a + p.b} className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-300 truncate flex-1">{p.a}</span>
                <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-amber-500/90"
                    style={{ width: `${Math.min(p.overlapPct, 100)}%` }}
                  />
                </div>
                <span className="text-amber-300 tabular-nums w-8 text-right">{p.overlapPct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500">
            Top shared holding:{" "}
            <span className="text-slate-300">{LANDING_MOCK_OVERLAP.topStock.name}</span> ·{" "}
            <span className="text-teal-400">{LANDING_MOCK_OVERLAP.topStock.combinedPct}%</span> combined
          </p>
        </MockChrome>
      );
    case "risk":
      return (
        <MockChrome title="Risk X-Ray">
          <div className="space-y-3">
            {[
              { label: "Flexi Cap core", level: "Very High", w: 88 },
              { label: "Large Cap anchor", level: "Moderately High", w: 62 },
              { label: "Debt buffer", level: "Low to Moderate", w: 28 },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">{r.label}</span>
                  <span className="text-slate-500">{r.level}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-indigo-500/80" style={{ width: `${r.w}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
            Risk labels are illustrative. Past performance is not indicative of future results.
          </p>
        </MockChrome>
      );
    case "compare":
      return (
        <MockChrome title="Compare funds">
          <div className="space-y-2">
            {LANDING_MOCK_COMPARE.funds.map((f, i) => (
              <div
                key={f.name}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 border text-[11px]",
                  i === 0 ? "border-teal-500/30 bg-teal-950/20" : "border-slate-800 bg-slate-900/50"
                )}
              >
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-slate-200 truncate">{f.name}</p>
                  <p className="text-slate-500">{f.category}</p>
                </div>
                <span className="text-emerald-400 font-bold tabular-nums shrink-0">+{f.xirr}%</span>
              </div>
            ))}
          </div>
        </MockChrome>
      );
    case "report":
      return (
        <MockChrome title="Portfolio report">
          <div className="space-y-2 text-[11px] text-slate-400">
            <div className="h-2 w-3/4 rounded bg-slate-800" />
            <div className="h-2 w-full rounded bg-slate-800/80" />
            <div className="h-2 w-5/6 rounded bg-slate-800/80" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-lg bg-slate-900 border border-slate-800" />
              ))}
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-teal-400">
            Print-ready layout · holdings & allocation summary
          </p>
        </MockChrome>
      );
    default:
      return null;
  }
}
