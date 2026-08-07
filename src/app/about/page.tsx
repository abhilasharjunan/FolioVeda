import React from 'react';
import { FadeIn } from '@/components/animations';
import { getBuildInfo } from '@/lib/build-info';

export default function AboutPage() {
  const { version } = getBuildInfo();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <FadeIn>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">
            Folio<span className="text-teal-600 dark:text-teal-400">Veda</span>
          </h1>
          <p className="font-mono text-2xl font-semibold text-slate-700 dark:text-slate-200">
            v{version}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
