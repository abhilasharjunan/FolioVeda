import React from 'react';
import { Info } from 'lucide-react';
import { FadeIn, PageSection } from '@/components/animations';
import { formatBuildTime, getBuildInfo } from '@/lib/build-info';

export default function AboutPage() {
  const { version, buildTime, gitCommit, gitCommitUrl, environment } = getBuildInfo();

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <FadeIn>
          <div className="surface-card rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <Info className="text-teal-600 dark:text-teal-400" size={28} />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">About FolioVeda</h1>
            </div>

            <div className="bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 rounded-xl p-6 mb-8">
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-4">Deployment info — confirm live version after each release</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-1">Version</p>
                  <p className="text-3xl font-bold text-teal-900 dark:text-teal-100 font-heading">{version}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-1">Environment</p>
                  <p className="text-lg font-semibold text-teal-900 dark:text-teal-100 capitalize">{environment}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-1">Built at</p>
                  <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">{formatBuildTime(buildTime)} IST</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-1">Git commit</p>
                  {gitCommit ? (
                    gitCommitUrl ? (
                      <a
                        href={gitCommitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-semibold text-teal-700 dark:text-teal-300 hover:underline"
                      >
                        {gitCommit}
                      </a>
                    ) : (
                      <p className="text-sm font-mono font-semibold text-teal-900 dark:text-teal-100">{gitCommit}</p>
                    )
                  ) : (
                    <p className="text-sm text-teal-700 dark:text-teal-300">—</p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-teal-700 dark:text-teal-400">
                JSON: <code className="font-mono">/api/version</code>
              </p>
            </div>

            <PageSection className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 font-heading">What is FolioVeda?</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  FolioVeda is your Indian mutual fund portfolio analyzer. Track XIRR, understand allocation and risk, and compare Direct Growth funds with clear, SEBI-aware insights.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 font-heading">Features</h2>
                <ul className="space-y-2">
                  {[
                    'Portfolio Tracking & Analysis',
                    'Risk Assessment & Ratings',
                    'Fund Comparison & Overlap Detection',
                    'Top Funds Discovery',
                    'SIP Calculator',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400 font-bold mt-1">•</span>
                      <span className="text-slate-600 dark:text-slate-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 font-heading">Compliance</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  FolioVeda follows SEBI-aware disclosure practices and treats your portfolio data as private account information.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  © {new Date().getFullYear()} FolioVeda. All rights reserved.
                </p>
              </div>
            </PageSection>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
