"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calculator, Wallet, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/animations";
import { cn } from "@/lib/utils";
import { SipPanel, isSipTab, type SipTab } from "@/components/tools/SipPanel";
import { SwpPanel, isSwpTab, type SwpTab } from "@/components/tools/SwpPanel";

export type PlannerMode = "sip" | "swp";

function parseMode(raw: string | null): PlannerMode {
  return raw === "swp" ? "swp" : "sip";
}

function defaultTab(mode: PlannerMode): string {
  return mode === "swp" ? "swp" : "sip";
}

function parseTab(mode: PlannerMode, raw: string | null): SipTab | SwpTab {
  if (mode === "sip") return isSipTab(raw) ? raw : "sip";
  return isSwpTab(raw) ? raw : "swp";
}

function SipSwpPlannerInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const mode = parseMode(searchParams.get("mode"));
  const tab = parseTab(mode, searchParams.get("tab"));

  const replaceQuery = useCallback(
    (nextMode: PlannerMode, nextTab: string) => {
      const params = new URLSearchParams();
      params.set("mode", nextMode);
      params.set("tab", nextTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  const setMode = (next: PlannerMode) => {
    if (next === mode) return;
    replaceQuery(next, defaultTab(next));
  };

  const setSipTab = (next: SipTab) => replaceQuery("sip", next);
  const setSwpTab = (next: SwpTab) => replaceQuery("swp", next);

  const hero = useMemo(
    () =>
      mode === "sip"
        ? {
            eyebrow: "Invest",
            title: "SIP Calculator & Scenarios",
            subtitle:
              "Forward-looking projections based on assumed returns — not a promise of actual returns. Use these to plan, not predict.",
            gradient: "from-indigo-600 via-indigo-600 to-indigo-900",
            muted: "text-indigo-100",
            Icon: Calculator,
          }
        : {
            eyebrow: "Withdraw",
            title: "SWP Calculator & Scenarios",
            subtitle:
              "Model systematic withdrawals from a corpus — how long money lasts, what remains, and sustainable drawdowns. Assumed returns are not a promise.",
            gradient: "from-teal-600 via-teal-700 to-slate-900",
            muted: "text-teal-100",
            Icon: Wallet,
          },
    [mode]
  );

  const HeroIcon = hero.Icon;

  return (
    <div className="px-4 py-6 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <header
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 sm:p-8 text-white mb-2",
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
            <span>Planning Tools</span>
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
        aria-label="Invest or withdraw planner"
        className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto sm:inline-flex"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sip"}
          onClick={() => setMode("sip")}
          className={cn(
            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            mode === "sip"
              ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Calculator size={15} />
          SIP · Invest
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "swp"}
          onClick={() => setMode("swp")}
          className={cn(
            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            mode === "swp"
              ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Wallet size={15} />
          SWP · Withdraw
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduceMotion ? false : { opacity: 0, x: mode === "sip" ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: mode === "sip" ? 10 : -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === "sip" ? (
            <SipPanel tab={tab as SipTab} onTabChange={setSipTab} />
          ) : (
            <SwpPanel tab={tab as SwpTab} onTabChange={setSwpTab} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function SipSwpPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 sm:p-6 max-w-7xl mx-auto text-sm text-slate-500">
          Loading planner…
        </div>
      }
    >
      <SipSwpPlannerInner />
    </Suspense>
  );
}
