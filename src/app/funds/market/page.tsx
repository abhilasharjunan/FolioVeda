"use client";

import React, { Suspense, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TrendingUp, ShieldAlert, Search, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/animations";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FUND_CATEGORIES, type FundCategory } from "@/lib/funds";
import {
  ReturnsPanel,
  type TopFundsPanelHandle,
} from "@/components/funds/ReturnsPanel";
import { RiskPanel } from "@/components/funds/RiskPanel";

export type TopFundsMode = "returns" | "risk";

function parseMode(raw: string | null): TopFundsMode {
  return raw === "risk" ? "risk" : "returns";
}

function parseCategory(raw: string | null): FundCategory | "All" {
  if (!raw || raw === "All") return "All";
  return (FUND_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as FundCategory)
    : "All";
}

function TopFundsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<TopFundsPanelHandle>(null);

  const mode = parseMode(searchParams.get("mode"));
  const category = parseCategory(searchParams.get("category"));
  const searchQuery = searchParams.get("q") ?? "";

  const replaceQuery = useCallback(
    (patch: { mode?: TopFundsMode; category?: FundCategory | "All"; q?: string }) => {
      const params = new URLSearchParams();
      const nextMode = patch.mode ?? mode;
      const nextCat = patch.category ?? category;
      const nextQ = patch.q !== undefined ? patch.q : searchQuery;
      params.set("mode", nextMode);
      if (nextCat !== "All") params.set("category", nextCat);
      if (nextQ.trim()) params.set("q", nextQ);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, mode, category, searchQuery]
  );

  const hero = useMemo(
    () =>
      mode === "returns"
        ? {
            eyebrow: "Returns",
            title: "Top Performing Funds",
            subtitle:
              "Direct Growth plans only · updated daily. Ranked by 3Y CAGR across curated benchmarks and AMFI Direct Growth funds with enough NAV history — including Momentum Index Funds.",
            gradient: "from-blue-600 via-indigo-600 to-slate-900",
            muted: "text-blue-100",
            Icon: TrendingUp,
          }
        : {
            eyebrow: "Risk",
            title: "Fund Risk Analysis",
            subtitle:
              "Quantitative assessment of volatility, drawdown, and concentration risk across benchmark funds.",
            gradient: "from-rose-600 via-rose-700 to-slate-900",
            muted: "text-rose-100",
            Icon: ShieldAlert,
          },
    [mode]
  );

  const HeroIcon = hero.Icon;

  return (
    <div className="px-4 py-6 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen">
      <FadeIn>
        <header
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 sm:p-8 text-white",
            hero.gradient
          )}
        >
          <Sparkles className="absolute -right-4 -top-4 text-white/10" size={140} strokeWidth={1} />
          <div
            className={cn(
              "relative flex items-center gap-2 font-semibold text-sm uppercase tracking-wider",
              hero.muted
            )}
          >
            <HeroIcon size={16} />
            <span>Top Funds · {hero.eyebrow}</span>
          </div>
          <h1 className="relative text-3xl sm:text-4xl font-bold tracking-tight mt-2 font-heading">
            {hero.title}
          </h1>
          <p className={cn("relative max-w-2xl mt-2 text-sm sm:text-base", hero.muted)}>
            {hero.subtitle}
          </p>
        </header>
      </FadeIn>

      <div
        role="tablist"
        aria-label="Returns or risk view"
        className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto sm:inline-flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "returns"}
          onClick={() => replaceQuery({ mode: "returns" })}
          className={cn(
            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            mode === "returns"
              ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <TrendingUp size={15} />
          Returns
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "risk"}
          onClick={() => replaceQuery({ mode: "risk" })}
          className={cn(
            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            mode === "risk"
              ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <ShieldAlert size={15} />
          Risk
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full min-w-0">
          {(["All", ...FUND_CATEGORIES] as const).map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => replaceQuery({ category: cat })}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
                  active
                    ? "bg-slate-900 dark:bg-blue-600 text-white border-transparent shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {cat === "All" ? "All Categories" : cat}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-end w-full shrink-0">
          <div className="relative w-full sm:w-72 sm:max-w-xs shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
              size={16}
            />
            <Input
              placeholder="Search funds..."
              className="pl-10 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              value={searchQuery}
              onChange={(e) => replaceQuery({ q: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={() => panelRef.current?.exportCsv()}
            className="shrink-0 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduceMotion ? false : { opacity: 0, x: mode === "returns" ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: mode === "returns" ? 10 : -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === "returns" ? (
            <ReturnsPanel
              ref={panelRef}
              activeCategory={category}
              searchQuery={searchQuery}
            />
          ) : (
            <RiskPanel
              ref={panelRef}
              activeCategory={category}
              searchQuery={searchQuery}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function TopFundsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 sm:p-6 max-w-7xl mx-auto text-sm text-slate-500">
          Loading top funds…
        </div>
      }
    >
      <TopFundsPageInner />
    </Suspense>
  );
}
