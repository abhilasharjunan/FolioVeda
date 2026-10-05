"use client";

import React from "react";
import { FeatureSceneGrid } from "@/components/landing/FeatureSceneGrid";

/** Read-only product preview — illustrative UI, not the user's portfolio. */
export function OnboardingProductPreview() {
  return (
    <div className="space-y-3">
      <div className="text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
          Sample preview
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          This is what FolioVeda looks like with holdings — your numbers appear after you add funds or import a CSV.
        </p>
      </div>
      <FeatureSceneGrid
        headlineClassName="text-slate-900 dark:text-slate-50"
        taglineClassName="text-slate-600 dark:text-slate-400"
      />
      <p className="text-[10px] text-center sm:text-left text-slate-500 dark:text-slate-500 leading-relaxed">
        Illustrative only. Past performance is not indicative of future results.
      </p>
    </div>
  );
}
