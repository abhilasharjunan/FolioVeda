"use client";

import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-8"
    >
      <Loader2
        className="size-8 text-teal-600 dark:text-teal-400 motion-safe:animate-spin"
        aria-hidden
      />
      <p className="font-heading text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
