"use client";

import React, { useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  OnboardingChecklist,
  dismissOnboardingChecklist,
  isOnboardingFullyComplete,
} from "./OnboardingChecklist";
import { readOnboardingState, getServerOnboardingSnapshot } from "@/lib/onboarding";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("folioveda-onboarding", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("folioveda-onboarding", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function OnboardingDashboardTip() {
  const [open, setOpen] = useState(false);
  const state = useSyncExternalStore(subscribe, readOnboardingState, getServerOnboardingSnapshot);

  if (isOnboardingFullyComplete() || state.checklistDismissed) {
    return null;
  }

  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/80 dark:bg-teal-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-teal-900 dark:text-teal-100"
      >
        <span>{state.completed.holdings ? "Continue exploring tools" : "New here? Explore all tools"}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-teal-100 dark:border-teal-900/40 pt-3">
          <OnboardingChecklist compact />
          <button
            type="button"
            onClick={() => dismissOnboardingChecklist()}
            className="mt-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Dismiss checklist
          </button>
        </div>
      )}
    </div>
  );
}
