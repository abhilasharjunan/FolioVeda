"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, X, Upload, Activity, Layers, ArrowRight, Calculator } from "lucide-react";
import { FadeIn, PageSection, StaggerChildren, StaggerItem, AnimatedNumber } from "@/components/animations";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  LANDING_HERO_PREVIEW,
  LANDING_PERSONAS,
  type LandingPersona,
  type LandingPersonaId,
} from "@/lib/landing-demo";
import { calculateSIPFutureValue } from "@/lib/sip-calculator";

function formatInr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function AllocationBars({
  allocation,
  className,
}: {
  allocation: LandingPersona["allocation"];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {allocation.map((a) => (
        <div key={a.label}>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{a.label}</span>
            <span className="tabular-nums text-slate-300">{a.weight}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${a.weight}%`, backgroundColor: a.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioPreview({
  persona,
  compact = false,
}: {
  persona: LandingPersona;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/70 backdrop-blur-sm",
        compact ? "p-4" : "p-5 sm:p-6"
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_#14b8a622_0%,_transparent_55%)]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-teal-400/90 font-semibold">
              Sample portfolio
            </p>
            <p className="text-sm font-medium text-slate-200 mt-0.5">{persona.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">XIRR</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">
              <AnimatedNumber value={persona.xirr} decimals={1} suffix="%" duration={0.45} />
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Current value</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-50 tabular-nums font-heading tracking-tight">
            ₹
            <AnimatedNumber value={persona.portfolioValue} format={formatInr} duration={0.5} />
          </p>
        </div>
        <AllocationBars allocation={persona.allocation} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [personaId, setPersonaId] = useState<LandingPersonaId>("balanced");
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipYears, setSipYears] = useState(15);

  const persona = LANDING_PERSONAS.find((p) => p.id === personaId) ?? LANDING_PERSONAS[1];
  const sipResult = useMemo(
    () =>
      calculateSIPFutureValue({
        monthlyAmount: sipMonthly,
        annualReturnPercent: 12,
        years: sipYears,
      }),
    [sipMonthly, sipYears]
  );

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="landing-ambient absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#1a3a3633_0%,_transparent_55%),linear-gradient(180deg,#0d1219_0%,#101820_50%,#0e151c_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgb(148_163_184_/_0.12)_1px,transparent_0)] [background-size:28px_28px]" />

      <nav className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center gap-3">
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 tracking-tight font-heading shrink-0">
            Folio<span className="text-teal-400">Veda</span>
          </div>

          <div className="hidden md:flex gap-2 lg:gap-3 items-center">
            <ThemeToggle />
            <Link
              href="/tools/sip-calculator"
              prefetch
              className={cn(buttonVariants({ variant: "ghost" }), "text-slate-300 hover:text-white hover:bg-slate-800/60")}
            >
              SIP Calculator
            </Link>
            <Link
              href="/academy"
              prefetch
              className={cn(buttonVariants({ variant: "ghost" }), "text-slate-300 hover:text-white hover:bg-slate-800/60")}
            >
              MF Academy
            </Link>
            <Link
              href="/about"
              prefetch
              className={cn(buttonVariants({ variant: "ghost" }), "text-slate-300 hover:text-white hover:bg-slate-800/60")}
            >
              About
            </Link>
            <Link
              href="/auth/signin"
              prefetch
              className={cn(buttonVariants({ variant: "ghost" }), "text-slate-300 hover:text-white hover:bg-slate-800/60")}
            >
              Login
            </Link>
            <Link
              href="/auth/signin"
              prefetch
              className={cn(buttonVariants({ variant: "default" }), "bg-teal-600 hover:bg-teal-500 text-white")}
            >
              Get Started
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center justify-center size-10 rounded-lg text-slate-200 hover:bg-slate-800/60"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-3 rounded-xl border border-slate-700/80 bg-slate-900/95 p-2 space-y-1">
            {[
              { href: "/tools/sip-calculator", label: "SIP Calculator" },
              { href: "/academy", label: "MF Academy" },
              { href: "/about", label: "About" },
              { href: "/auth/signin", label: "Login" },
            ].map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                prefetch
                onClick={() => setMenuOpen(false)}
                className="flex w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/80"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/auth/signin"
              prefetch
              onClick={() => setMenuOpen(false)}
              className={cn(buttonVariants({ variant: "default" }), "w-full bg-teal-600 hover:bg-teal-500 text-white mt-1")}
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <FadeIn>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-teal-400/90 mb-4">
              Mutual fund portfolio analyzer
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-50 mb-4 tracking-tight font-heading leading-[1.05]">
              Folio<span className="text-teal-400">Veda</span>
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-200 mb-3">
              See what your funds are actually doing.
            </p>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mb-8 leading-relaxed">
              XIRR that respects transaction dates, look-through overlap, and SEBI-aware risk — built for Indian Direct Growth investors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signin"
                prefetch
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "bg-teal-600 hover:bg-teal-500 text-white px-8 py-5 text-base"
                )}
              >
                Start Analyzing Free
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-5 text-base border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800/60"
                onClick={() => scrollTo("sample")}
              >
                Try a sample portfolio
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">Direct plans · true XIRR · overlap & sector look-through</p>
          </FadeIn>

          <FadeIn delay={0.08} className="lg:justify-self-end w-full max-w-md mx-auto lg:mx-0">
            <PortfolioPreview persona={LANDING_HERO_PREVIEW} />
          </FadeIn>
        </div>
      </section>

      {/* Sample portfolio */}
      <PageSection id="sample" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-24">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 font-heading">Try a sample portfolio</h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl mx-auto">
              Flip personas to see how allocation and illustrative XIRR shift — then analyze your real holdings.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <FadeIn delay={0.04}>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
              {LANDING_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonaId(p.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    personaId === p.id
                      ? "bg-teal-600/20 border-teal-500/50 text-teal-300"
                      : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed text-center lg:text-left">{persona.blurb}</p>
            <div className="flex justify-center lg:justify-start">
              <Link
                href="/auth/signin"
                prefetch
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-teal-600 hover:bg-teal-500 text-white gap-2"
                )}
              >
                Analyze my real portfolio
                <ArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <PortfolioPreview persona={persona} />
          </FadeIn>
        </div>
      </PageSection>

      {/* How it works */}
      <PageSection id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 font-heading">How it works</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Three steps from holdings to clear decisions.</p>
        </div>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6" stagger={0.06}>
          {[
            {
              icon: Upload,
              title: "Import holdings",
              desc: "Add funds manually or via CSV — we sync NAVs and compute live value.",
              href: "/auth/signin",
              linkLabel: "Get started",
            },
            {
              icon: Activity,
              title: "See XIRR & risk",
              desc: "True cash-flow XIRR, health score, and SEBI-aware risk views — not vanity CAGR.",
              href: "/academy",
              linkLabel: "Learn the jargon",
            },
            {
              icon: Layers,
              title: "Spot overlap",
              desc: "Look-through stock and sector concentration across funds you thought were diversified.",
              href: "/tools/sip-calculator",
              linkLabel: "Try SIP math",
            },
          ].map((step) => (
            <StaggerItem key={step.title}>
              <div className="h-full flex flex-col text-left">
                <div className="mb-4 p-3 bg-slate-800/60 w-fit rounded-xl">
                  <step.icon className="text-teal-400" size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-50 mb-2 font-heading">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-4">{step.desc}</p>
                <Link href={step.href} prefetch className="text-sm font-medium text-teal-400 hover:text-teal-300 inline-flex items-center gap-1">
                  {step.linkLabel} <ArrowRight size={14} />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </PageSection>

      {/* Mini SIP */}
      <PageSection id="sip" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 scroll-mt-24">
        <FadeIn>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="text-teal-400" size={20} />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-50 font-heading">Quick SIP check</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6 max-w-xl">
              Drag the monthly amount and horizon — future value updates instantly at 12% assumed return.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Monthly SIP</span>
                    <span className="font-semibold text-slate-100 tabular-nums">₹{formatInr(sipMonthly)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={50000}
                    step={500}
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full accent-teal-500 h-2 rounded-full cursor-pointer"
                    aria-label="Monthly SIP amount"
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Years</p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setSipYears(y)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          sipYears === y
                            ? "bg-teal-600/20 border-teal-500/50 text-teal-300"
                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                        )}
                      >
                        {y} yrs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Projected value</p>
                  <p className="text-3xl font-bold text-slate-50 tabular-nums font-heading mt-1">
                    ₹
                    <AnimatedNumber value={Math.round(sipResult.futureValue)} format={formatInr} duration={0.4} />
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Invested ₹{formatInr(Math.round(sipResult.totalInvested))} · Gain ₹
                    {formatInr(Math.round(sipResult.totalGain))}
                  </p>
                </div>
                <Link
                  href="/tools/sip-calculator"
                  prefetch
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full sm:w-auto border-slate-600 text-slate-200 hover:bg-slate-800/60 gap-2"
                  )}
                >
                  Open full SIP Calculator <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </PageSection>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 font-heading mb-3">Ready for your real numbers?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Create a free account and import holdings in minutes.
          </p>
          <Link
            href="/auth/signin"
            prefetch
            className={cn(buttonVariants({ size: "lg" }), "bg-teal-600 hover:bg-teal-500 text-white px-8")}
          >
            Start Analyzing Free
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
