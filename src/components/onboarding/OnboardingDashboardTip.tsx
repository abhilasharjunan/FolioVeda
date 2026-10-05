"use client";

import React, { useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  OnboardingChecklist,
  dismissOnboardingChecklist,
  isOnboardingFullyComplete,
} from "./OnboardingChecklist";
import { readOnboardingState } from "@/lib/onboarding";

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
  const state = useSyncExternalStore(subscribe, () => readOnboardingState(), () => readOnboardingState());

  if (isOnboardingFullyComplete() || state.checklistDismissed) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/80 dark:bg-indigo-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-indigo-900 dark:text-indigo-100"
      >
        <span>New here? Explore all tools</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-indigo-100 dark:border-indigo-900/40 pt-3">
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
