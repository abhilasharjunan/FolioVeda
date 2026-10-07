"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/animations";
import { LANDING_TOUR_SNAPSHOT } from "@/lib/landing-tour-snapshot";
import type { LandingFeatureSceneId } from "@/lib/landing-feature-scenes";

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

const snap = LANDING_TOUR_SNAPSHOT;

export function FeatureSceneVisual({ id }: { id: LandingFeatureSceneId }) {
  switch (id) {
    case "dashboard":
      return (
        <MockChrome title="Dashboard · Portfolio Overview">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Value</p>
              <p className="text-lg font-bold text-slate-50 tabular-nums">
                ₹<AnimatedNumber value={snap.portfolioValue} format={formatInr} duration={0.5} />
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">XIRR</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                <AnimatedNumber value={snap.xirr} decimals={1} suffix="%" duration={0.45} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-teal-500/20 bg-teal-950/30 p-3">
            <div
              className="relative size-12 rounded-full border-2 border-teal-500/40 flex items-center justify-center"
              aria-hidden
            >
              <span className="text-xs font-bold text-teal-300">{snap.healthScore}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Portfolio health</p>
              <p className="text-[11px] text-slate-400">
                Invested ₹{formatInr(snap.invested)} · {snap.holdings.length} funds
              </p>
            </div>
          </div>
        </MockChrome>
      );
    case "holdings":
      return (
        <MockChrome title="Portfolio · Holdings">
          <p className="text-[10px] text-teal-400/90 font-semibold mb-2">CSV import · manual add</p>
          <div className="space-y-1.5 max-h-[200px] overflow-hidden">
            {snap.holdings.slice(0, 5).map((h) => (
              <div
                key={h.name}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px]"
              >
                <div className="min-w-0">
                  <p className="text-slate-200 truncate font-medium">{h.name}</p>
                  <p className="text-slate-500">{h.category}</p>
                </div>
                <span className="tabular-nums text-slate-300 shrink-0">₹{formatInr(h.value)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">+{snap.holdings.length - 5} more schemes</p>
        </MockChrome>
      );
    case "overlap":
      return (
        <MockChrome title="Overlap · Look-through">
          <p className="text-xs text-slate-400 mb-3">Pairwise fund overlap (illustrative)</p>
          <div className="space-y-2">
            {snap.overlap.pairs.map((p) => (
              <div key={p.a + p.b} className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-300 truncate flex-1">
                  {p.a} · {p.b}
                </span>
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
            <span className="text-slate-300">{snap.overlap.topStock.name}</span> ·{" "}
            <span className="text-teal-400">{snap.overlap.topStock.combinedPct}%</span> combined
          </p>
        </MockChrome>
      );
    case "risk":
      return (
        <MockChrome title="Risk X-Ray">
          <div className="space-y-3">
            {snap.riskRows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 truncate pr-2">{r.label}</span>
                  <span className="text-slate-500 shrink-0">{r.level}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-teal-500/80" style={{ width: `${r.w}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
            Risk labels are illustrative. Past performance is not indicative of future results.
          </p>
        </MockChrome>
      );
    case "diversify":
      return (
        <MockChrome title="Diversification · Categories">
          <div className="space-y-2.5">
            {snap.allocation.map((a) => (
              <div key={a.label}>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>{a.label}</span>
                  <span className="tabular-nums text-slate-300">{a.weight}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${a.weight}%`, backgroundColor: a.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500">
            Health score <span className="text-teal-400 font-semibold">{snap.healthScore}</span> ·{" "}
            {snap.report.categories} categories
          </p>
        </MockChrome>
      );
    case "compare":
      return (
        <MockChrome title="Compare funds">
          <div className="space-y-2">
            {snap.compare.funds.map((f, i) => (
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
    case "sip":
      return (
        <MockChrome title="SIP Calculator">
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <p className="text-[9px] uppercase text-slate-500">Monthly</p>
              <p className="text-sm font-bold text-slate-100 tabular-nums">₹{formatInr(snap.sip.monthly)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <p className="text-[9px] uppercase text-slate-500">Years</p>
              <p className="text-sm font-bold text-slate-100 tabular-nums">{snap.sip.years}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <p className="text-[9px] uppercase text-slate-500">Assumed</p>
              <p className="text-sm font-bold text-slate-100 tabular-nums">{snap.sip.assumedReturnPct}%</p>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Projected value</p>
          <p className="text-2xl font-bold text-teal-400 tabular-nums font-heading">
            ₹<AnimatedNumber value={snap.sip.futureValue} format={formatInr} duration={0.55} />
          </p>
          <p className="mt-2 text-[10px] text-slate-500">Planning tool only — not a guarantee of returns.</p>
        </MockChrome>
      );
    case "report":
      return (
        <MockChrome title="Portfolio report">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Funds", value: String(snap.report.funds) },
              { label: "Gain", value: `₹${formatInr(snap.report.gain)}` },
              { label: "XIRR", value: `${snap.xirr}%` },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-center">
                <p className="text-[9px] uppercase text-slate-500">{c.label}</p>
                <p className="text-xs font-bold text-slate-100 tabular-nums mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-[11px] text-slate-400">
            <div className="h-2 w-3/4 rounded bg-slate-800" />
            <div className="h-2 w-full rounded bg-slate-800/80" />
            <div className="h-2 w-5/6 rounded bg-slate-800/80" />
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
