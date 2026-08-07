"use client";

import React from "react";
import { FadeIn } from "@/components/animations";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_50%),linear-gradient(180deg,#f8fafc,#eef2ff)] dark:bg-[radial-gradient(ellipse_at_top,_#1e3a8a44_0%,_transparent_50%),linear-gradient(180deg,#0f172a,#111827)]" />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <FadeIn className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">
            Folio<span className="text-blue-600">Veda</span>
          </div>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {children}
      </FadeIn>
    </div>
  );
}
