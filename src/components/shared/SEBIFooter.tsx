import React from 'react';
import { AppVersion } from '@/components/shared/AppVersion';

export const SEBIFooter = () => {
  return (
    <footer className="print:hidden border-t border-slate-200/60 dark:border-slate-800/60 bg-transparent py-2.5 px-4 text-center text-[10px] leading-snug text-slate-400 dark:text-slate-500">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <p className="sm:text-left">
          FolioVeda is analytics only — not investment advice. Mutual fund investments are subject to market risks.
          NAV data from AMFI/mfapi.in may lag.
        </p>
        <p className="flex items-center justify-center sm:justify-end gap-1.5 shrink-0 whitespace-nowrap">
          <span>© {new Date().getFullYear()} FolioVeda</span>
          <span aria-hidden="true">·</span>
          <AppVersion />
        </p>
      </div>
    </footer>
  );
};
