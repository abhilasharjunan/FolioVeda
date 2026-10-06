"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_FEATURE_SCENES } from "@/lib/landing-feature-scenes";
import { FeatureSceneVisual } from "./FeatureSceneVisual";
import { FeatureSceneGrid } from "./FeatureSceneGrid";

const SCENE_MS = 7000;
const easeOut = [0.22, 1, 0.36, 1] as const;

export function FeatureShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scene = LANDING_FEATURE_SCENES[index];
  const total = LANDING_FEATURE_SCENES.length;

  const go = useCallback((next: number) => {
    setIndex((next + total) % total);
  }, [total]);

  useEffect(() => {
    if (reduce || paused) return;
    const t = window.setInterval(() => go(index + 1), SCENE_MS);
    return () => window.clearInterval(t);
  }, [reduce, paused, index, go]);

  if (reduce) {
    return <FeatureSceneGrid showSignUpCta />;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="relative min-h-[280px] sm:min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              <FeatureSceneVisual id={scene.id} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-5">
          <div aria-live="polite" aria-atomic="true">
            <p className="text-[10px] uppercase tracking-wider text-teal-400/90 font-semibold mb-2">
              {scene.title}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id + "-copy"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: easeOut }}
              >
                <h3 className="text-xl sm:text-2xl font-bold text-slate-50 font-heading leading-snug">
                  {scene.headline}
                </h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{scene.tagline}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/auth/signin"
              prefetch
              className={cn(buttonVariants({ size: "lg" }), "bg-teal-600 hover:bg-teal-500 text-white")}
            >
              Start analyzing free
            </Link>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
              aria-label={paused ? "Resume tour" : "Pause tour"}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Resume tour" : "Pause tour"}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/60"
              aria-label="Previous feature"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1.5 flex-1 justify-center">
              {LANDING_FEATURE_SCENES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-6 bg-teal-500" : "w-2 bg-slate-600 hover:bg-slate-500"
                  )}
                  aria-label={`Show ${s.title}`}
                  aria-current={i === index ? "true" : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/60"
              aria-label="Next feature"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center sm:text-left">
            Auto-advances every {SCENE_MS / 1000}s · hover to pause
          </p>
        </div>
      </div>
    </div>
  );
}
