"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingChecklist, dismissWelcomeBanner } from "./OnboardingChecklist";
import { OnboardingProductPreview } from "./OnboardingProductPreview";
import { readOnboardingState } from "@/lib/onboarding";

type FirstRunGuideProps = {
  showWelcome?: boolean;
};

function subscribe(onStoreChange: () => void) {
  window.addEventListener("folioveda-onboarding", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("folioveda-onboarding", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function FirstRunGuide({ showWelcome = false }: FirstRunGuideProps) {
  const onboarding = useSyncExternalStore(subscribe, () => readOnboardingState(), () => readOnboardingState());

  const welcomeVisible = showWelcome || !onboarding.welcomeDismissed;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      {welcomeVisible && (
        <div className="relative rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/30 px-4 py-3 text-left">
          <button
            type="button"
            onClick={() => dismissWelcomeBanner()}
            className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Dismiss welcome message"
          >
            <X size={16} />
          </button>
          <p className="text-sm font-medium text-teal-900 dark:text-teal-100 pr-6">
            Welcome to FolioVeda — add a fund or import CSV to see your live dashboard.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 p-5 sm:p-8 shadow-sm text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 font-heading">
              Add holdings to unlock your dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Browse the sample preview below, then add your mutual funds — overlap, XIRR, and reports use your real data.
            </p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-500 text-white shrink-0 w-full sm:w-auto">
            <Link href="/portfolio">Add or import holdings</Link>
          </Button>
        </div>
        <OnboardingProductPreview />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 p-5 shadow-sm max-w-lg mx-auto sm:max-w-none">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center sm:text-left">
          After your first holding, use this checklist to explore each tool.
        </p>
        <OnboardingChecklist />
      </div>
    </div>
  );
}
