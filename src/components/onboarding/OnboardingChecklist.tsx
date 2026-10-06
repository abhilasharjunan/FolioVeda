"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readOnboardingState,
  writeOnboardingState,
  onboardingProgress,
  getServerOnboardingSnapshot,
  type OnboardingStepId,
} from "@/lib/onboarding";

const STEPS: { id: OnboardingStepId; label: string; href: string }[] = [
  { id: "holdings", label: "Add or import your first holding", href: "/portfolio" },
  { id: "risk", label: "Open Risk X-Ray (after holdings)", href: "/portfolio/risk" },
  { id: "overlap", label: "Explore fund overlap (after holdings)", href: "/portfolio/overlap" },
  { id: "compare", label: "Compare two funds", href: "/funds/compare" },
  { id: "report", label: "View your portfolio report (after holdings)", href: "/portfolio/report" },
];

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("folioveda-onboarding", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("folioveda-onboarding", onStoreChange);
  };
}

function getSnapshot() {
  return readOnboardingState();
}

function notifyOnboarding() {
  window.dispatchEvent(new Event("folioveda-onboarding"));
}

export function markHoldingsOnboardingComplete() {
  const current = readOnboardingState();
  writeOnboardingState({
    ...current,
    completed: { ...current.completed, holdings: true },
  });
  notifyOnboarding();
}

type OnboardingChecklistProps = {
  compact?: boolean;
  className?: string;
};

export function OnboardingChecklist({ compact = false, className }: OnboardingChecklistProps) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerOnboardingSnapshot);
  const { done, total } = onboardingProgress(state);

  return (
    <div className={cn("text-left", className)}>
      {!compact && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 font-heading">
            Explore FolioVeda
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {done}/{total}
          </span>
        </div>
      )}
      <ul className={cn("space-y-2", compact && "space-y-1.5")}>
        {STEPS.map((step) => {
          const complete = !!state.completed[step.id];
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                  complete
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                    : "border-slate-200 dark:border-slate-700/80 hover:border-teal-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40",
                  compact && "py-2 text-sm"
                )}
              >
                {complete ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle className="size-4 text-slate-400 shrink-0 mt-0.5" aria-hidden />
                )}
                <span
                  className={cn(
                    "text-sm leading-snug",
                    complete ? "text-slate-600 dark:text-slate-300" : "text-slate-800 dark:text-slate-100"
                  )}
                >
                  {step.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function dismissOnboardingChecklist() {
  const current = readOnboardingState();
  writeOnboardingState({ ...current, checklistDismissed: true });
  notifyOnboarding();
}

export function dismissWelcomeBanner() {
  const current = readOnboardingState();
  writeOnboardingState({ ...current, welcomeDismissed: true });
  notifyOnboarding();
}

export function isOnboardingFullyComplete(): boolean {
  const { done, total } = onboardingProgress(readOnboardingState());
  return done >= total;
}

export function isChecklistDismissed(): boolean {
  return readOnboardingState().checklistDismissed;
}
