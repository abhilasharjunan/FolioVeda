"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Clock,
  Target,
  ArrowRight,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/animations";
import { ACADEMY_SIP_VIDEOS } from "@/lib/academy-videos";
import { cn } from "@/lib/utils";

const COMPARISON_ROWS = [
  {
    feature: "Historical Returns",
    mf: "12% – 15% CAGR (equity, long-term)",
    insurance: "4% – 6% (barely beats inflation)",
    mfStrong: true,
    insuranceBad: true,
  },
  {
    feature: "Transparency & Fees",
    mf: "High disclosure · Expense Ratio ~0.5% – 1.5%",
    insurance: "Heavy upfront agent commissions & hidden charges",
    mfStrong: false,
    insuranceBad: false,
  },
  {
    feature: "Liquidity & Exit",
    mf: "Redeem anytime (or 1-yr exit load / 3-yr ELSS lock-in)",
    insurance: "Locked 5–15 years with heavy surrender penalties",
    mfStrong: false,
    insuranceBad: false,
  },
  {
    feature: "Optimal Strategy",
    mf: "Pure investment tool",
    insurance: "Separate them! Cheap term life for protection + Mutual Funds for wealth.",
    mfStrong: true,
    insuranceBad: false,
    insuranceHighlight: true,
  },
] as const;

const HORIZONS = [
  {
    icon: Clock,
    iconClass: "text-sky-500",
    title: "Short Term (0 – 3 Years)",
    goal: "Capital safety & liquidity",
    body: "Avoid equity volatility. Stick to high-grade debt instruments.",
    badges: ["Liquid Funds", "Arbitrage Funds (tax-efficient)", "Low Duration Debt Funds"],
  },
  {
    icon: TrendingUp,
    iconClass: "text-amber-500",
    title: "Medium Term (3 – 5 Years)",
    goal: "Balanced growth with controlled risk",
    body: "Blend debt stability with equity growth potential.",
    badges: ["Balanced Advantage Funds", "Aggressive Hybrid Funds", "Large Cap Index (Nifty 50)"],
  },
  {
    icon: GraduationCap,
    iconClass: "text-emerald-500",
    title: "Long Term (5+ Years)",
    goal: "Wealth compounding",
    body: "Ride short-term dips for long-term gains. Stay invested.",
    badges: ["Nifty 500 / Flexi Cap", "Factor / Momentum Index", "Mid & Small Cap (high risk)"],
  },
] as const;

const RESOURCES = [
  {
    href: "https://zerodha.com/varsity/module/personalfinance/",
    title: "Zerodha Varsity (Personal Finance)",
    description: "Free, no-nonsense text modules on SIPs, debt, and tax basics.",
  },
  {
    href: "https://www.youtube.com/@Freefincal",
    title: "Freefincal (Dr. M. Pattabiraman)",
    description: "Data-driven analysis of mutual fund risk and goal planning.",
  },
  {
    href: "https://www.youtube.com/@LaborLawAdvisor",
    title: "Labor Law Advisor (LLA)",
    description: "Exposes insurance traps and simplifies investing for beginners.",
  },
  {
    href: "https://www.amfiindia.com/investor-corner",
    title: "AMFI — Investor Corner",
    description: "Official AMFI investor education and scheme disclosure portals.",
  },
] as const;

function YoutubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export default function AcademyPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <FadeIn>
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1"
          >
            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
            Investor Academy
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-heading">
            Demystifying Mutual Funds
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Everything a beginner needs to build real wealth, dodge low-yield endowment and ULIP traps,
            and pick funds with confidence.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Card className="surface-card border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-slate-50 font-heading">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  Wealth Creation vs. Insurance Traps
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Mixing investment with life insurance is how agents get paid — not how you get rich.
                  Pure Mutual Funds + cheap Term Insurance wins.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
              >
                Golden Rule
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 sm:p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="p-3 sm:p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pure Mutual Funds (SIP)
                  </th>
                  <th className="p-3 sm:p-4 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Endowment / ULIP Insurance
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                  >
                    <td className="p-3 sm:p-4 text-sm font-semibold text-slate-800 dark:text-slate-100 align-top">
                      {row.feature}
                    </td>
                    <td
                      className={`p-3 sm:p-4 text-sm align-top ${
                        row.mfStrong
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {row.mf}
                    </td>
                    <td
                      className={`p-3 sm:p-4 text-sm align-top ${
                        row.insuranceBad
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {"insuranceHighlight" in row && row.insuranceHighlight ? (
                        <>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Separate them!{" "}
                          </span>
                          Buy cheap term life for protection + invest the rest in Mutual Funds.
                        </>
                      ) : (
                        row.insurance
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Educational comparison only — not investment or insurance advice. Past returns do not
              guarantee future results.
            </p>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.06}>
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
              Mutual Fund Jargon Decoder
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Click any term for a plain-English explanation.
          </p>

          <Card className="surface-card border-none shadow-sm p-4 sm:p-5">
            <Accordion>
              <AccordionItem value="nav" className="border-slate-200 dark:border-slate-800">
                <AccordionTrigger className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                  NAV (Net Asset Value)
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 dark:text-slate-400">
                  The price of one unit of a mutual fund. If a fund holds assets worth ₹100 crore and
                  has 1 crore units, NAV is ₹100. A lower NAV does{" "}
                  <em>not</em> make a fund cheaper or better than a higher-NAV fund.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sip" className="border-slate-200 dark:border-slate-800">
                <AccordionTrigger className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                  SIP vs. Lumpsum
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-200">SIP</strong> — invest a fixed
                  amount monthly to smooth market volatility (rupee cost averaging).{" "}
                  <strong className="text-slate-700 dark:text-slate-200">Lumpsum</strong> — invest a
                  large sum at once. Often fine for debt/liquid funds or after a deep market
                  correction.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="xirr" className="border-slate-200 dark:border-slate-800">
                <AccordionTrigger className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                  XIRR vs. CAGR
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-200">CAGR</strong> measures
                  point-to-point annual growth for a one-time investment.{" "}
                  <strong className="text-slate-700 dark:text-slate-200">XIRR</strong> is the right
                  annualised return when you have multiple cash flows on different dates — like
                  monthly SIPs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="direct" className="border-slate-200 dark:border-slate-800">
                <AccordionTrigger className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Direct Plan vs. Regular Plan
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-200">Direct plans</strong> have
                  zero distributor commissions — lower expense ratio and typically{" "}
                  <strong className="text-slate-700 dark:text-slate-200">1%–1.5% higher</strong> annual
                  returns vs Regular. Prefer Direct Growth funds.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="expense" className="border-slate-200 dark:border-slate-800">
                <AccordionTrigger className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Expense Ratio
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 dark:text-slate-400">
                  The annual fee the AMC charges to manage your money. A 0.75% expense ratio means
                  about ₹75 a year for every ₹10,000 invested — deducted from the fund&apos;s NAV,
                  not billed separately.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
              Which Fund Type Fits Your Goal?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {HORIZONS.map((h) => {
              const Icon = h.icon;
              return (
                <Card key={h.title} className="surface-card border-none shadow-sm">
                  <CardHeader>
                    <Icon className={`w-6 h-6 ${h.iconClass} mb-2`} />
                    <CardTitle className="text-lg font-heading text-slate-900 dark:text-slate-50">
                      {h.title}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                      Goal: {h.goal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>{h.body}</p>
                    <div className="space-y-1.5 pt-1">
                      {h.badges.map((b) => (
                        <Badge
                          key={b}
                          variant="secondary"
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 block w-fit font-normal"
                        >
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
              Watch: Why the SIP Math Works
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
            Short explainers on compounding, step-up SIPs, and SIP vs lumpsum — then test the numbers
            in FolioVeda&apos;s calculator.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACADEMY_SIP_VIDEOS.map((v) => (
              <Card key={v.id} className="surface-card border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-2 space-y-1">
                  <Badge
                    variant="outline"
                    className="w-fit text-[10px] border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                  >
                    {v.topic}
                  </Badge>
                  <CardTitle className="text-base font-heading text-slate-900 dark:text-slate-50 leading-snug">
                    {v.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    {v.blurb}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <YoutubeEmbed id={v.id} title={v.title} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-slate-50 font-heading">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Recommended Indian Educational Resources
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Free, high-signal channels and portals for personal finance literacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RESOURCES.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-colors group"
                >
                  <h4 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5 text-sm">
                    {r.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.14}>
        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-100/80 via-slate-50 to-emerald-100/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
            Ready to test your wealth growth numbers?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Use FolioVeda&apos;s SIP Calculator and Scenario Comparison to simulate compounding across
            5, 10, and 15 years — including step-up SIPs.
          </p>
          <Link
            href="/tools/sip-calculator"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-2 inline-flex"
            )}
          >
            Open SIP Calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
