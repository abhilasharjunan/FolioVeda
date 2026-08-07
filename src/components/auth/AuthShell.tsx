"use client";

import React from "react";
import Link from "next/link";
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#1a3a3633_0%,_transparent_50%),linear-gradient(180deg,#0d1219,#101820)]" />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <FadeIn className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-slate-50 font-heading">
            Folio<span className="text-teal-400">Veda</span>
          </div>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/about" className="font-mono hover:text-slate-300 transition-colors">
            v{process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown'}
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
