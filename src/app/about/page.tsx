"use client";

import React from 'react';
import { Info } from 'lucide-react';
import packageJson from '../../../package.json';
import { FadeIn, PageSection } from '@/components/animations';

export default function AboutPage() {
  const version = packageJson.version;

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <FadeIn>
          <div className="surface-card rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <Info className="text-blue-600" size={28} />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">About FolioVeda</h1>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Version</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 font-heading">{version}</p>
                </div>
                <div className="text-right text-xs text-blue-600">
                  <p>Latest Build</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
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
                      <span className="text-blue-600 font-bold mt-1">•</span>
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
