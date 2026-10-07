import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Database, Cpu, Activity, Sparkles, Lock, Scale, LineChart, ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { getBuildInfo } from '@/lib/build-info';
import { CHANGELOG } from '@/lib/changelog';

export default function AboutPage() {
  const { version, environment } = getBuildInfo();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <FadeIn>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="h-7 px-3 text-teal-700 dark:text-teal-300 border-teal-300/60 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Version {version}
            </Badge>
            {environment && environment !== 'production' && (
              <Badge variant="secondary" className="h-7 px-3 capitalize">
                {environment}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-heading">
            About Folio<span className="text-teal-600 dark:text-teal-400">Veda</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
            Institutional-grade mutual fund analytics and portfolio intelligence for modern investors —
            XIRR tracking, allocation insights, overlap detection, and SEBI-aware risk views.
          </p>
        </div>
      </FadeIn>

      <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.06}>
        <StaggerItem>
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader>
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
              <CardTitle className="text-lg font-heading">Data Sourcing</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                NAV and scheme feeds
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Powered by AMFI bulk NAV and mfapi.in scheme history. Daily NAV sync runs after market close;
              live lookups fill gaps when a fund is first added.
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader>
              <Cpu className="w-6 h-6 text-teal-600 dark:text-teal-400 mb-2" />
              <CardTitle className="text-lg font-heading">Analytics Engine</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Calculation methodology
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              XIRR over transaction cash flows, CAGR windows for fund rankings, portfolio diversification
              scores, weighted risk metrics, and holding-level stock overlap checks.
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader>
              <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400 mb-2" />
              <CardTitle className="text-lg font-heading">Privacy First</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Your data stays yours
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Holdings and transactions are stored in your account only. FolioVeda never sells portfolio
              data and does not connect to broker login credentials.
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerChildren>

      <FadeIn delay={0.1}>
        <details className="group surface-card rounded-xl shadow-sm open:ring-1 open:ring-slate-200/80 dark:open:ring-slate-700/80">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 rounded-xl outline-none transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 focus-visible:ring-2 focus-visible:ring-teal-500/40 [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <Activity className="w-5 h-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
              <span className="text-base font-semibold font-heading text-slate-900 dark:text-slate-50">
                Version History
              </span>
              <Badge variant="outline" className="font-mono text-[11px]">
                v{version}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {CHANGELOG.length} releases
              </span>
            </div>
            <ChevronDown
              className="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-5 space-y-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Product changelog for signed-in builds. Expand a release to skim what shipped.
            </p>
            {CHANGELOG.map((release) => (
              <div key={release.version} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={release.version === version ? 'default' : 'outline'}
                    className="font-mono"
                  >
                    v{release.version}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{release.date}</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {release.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-500 font-bold mt-0.5" aria-hidden>
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FadeIn delay={0.12}>
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader>
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
              <CardTitle className="text-base font-heading">Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                FolioVeda is an analytics tool only — not investment advice, not a SEBI-registered advisor,
                and not a fund distributor.
              </p>
              <p>
                Mutual fund investments are subject to market risks. Past XIRR or CAGR is not a guarantee
                of future returns. Always read the scheme SID and consult a qualified advisor when needed.
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.14}>
          <Card className="surface-card border-none shadow-sm h-full">
            <CardHeader>
              <LineChart className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
              <CardTitle className="text-base font-heading">How returns are shown</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-800 dark:text-slate-100">XIRR</strong> is annualized only
                after roughly a year of cash-flow history. Newer holdings show absolute return instead
                of a misleading compounded figure.
              </p>
              <p>
                Top Funds and Fund Ratings use Direct Growth plans where available; NAV data from AMFI/mfapi.in
                may lag by a business day.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.16}>
        <Card className="surface-card border-none shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Security & access</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Accounts use authenticated sessions. Cron sync jobs require a server secret.
                  Portfolio export stays under your control from the Portfolio section.
                </p>
              </div>
            </div>
            <Link
              href="/portfolio"
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              Open Portfolio
            </Link>
          </CardContent>
        </Card>
      </FadeIn>

      <p className="text-center text-xs text-slate-500 dark:text-slate-500">
        © {new Date().getFullYear()} FolioVeda. Analytics only — not investment advice.
      </p>
    </div>
  );
}
