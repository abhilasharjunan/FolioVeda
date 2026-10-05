"use client";

import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_FEATURE_SCENES } from "@/lib/landing-feature-scenes";
import { FeatureSceneVisual } from "./FeatureSceneVisual";

type FeatureSceneGridProps = {
  showSignUpCta?: boolean;
  headlineClassName?: string;
  taglineClassName?: string;
  className?: string;
};

export function FeatureSceneGrid({
  showSignUpCta = false,
  headlineClassName = "text-slate-100",
  taglineClassName = "text-slate-400",
  className,
}: FeatureSceneGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {LANDING_FEATURE_SCENES.map((s) => (
        <div key={s.id} className="space-y-3">
          <FeatureSceneVisual id={s.id} />
          <div>
            <h3 className={cn("text-sm font-bold font-heading", headlineClassName)}>{s.headline}</h3>
            <p className={cn("text-xs mt-1 leading-relaxed", taglineClassName)}>{s.tagline}</p>
          </div>
        </div>
      ))}
      {showSignUpCta && (
        <div className="sm:col-span-2 lg:col-span-3 text-center pt-2">
          <Link
            href="/auth/signin"
            prefetch
            className={cn(buttonVariants({ size: "lg" }), "bg-teal-600 hover:bg-teal-500 text-white px-8")}
          >
            Start analyzing free
          </Link>
        </div>
      )}
    </div>
  );
}
