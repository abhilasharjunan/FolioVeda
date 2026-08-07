"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ManualHoldingEntry from '@/components/portfolio/ManualHoldingEntry';
import CsvUpload from '@/components/portfolio/CsvUpload';
import HoldingsList from '@/components/portfolio/HoldingsList';
import PortfolioSectorChart from '@/components/portfolio/PortfolioSectorChart';
import { FadeIn } from '@/components/animations';
import { motion } from 'framer-motion';

export default function PortfolioManager() {
  const [entryMode, setEntryMode] = useState<'manual' | 'csv'>('manual');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">Manage Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-300">Add or modify your mutual fund holdings.</p>
        </div>
      </FadeIn>

      <div className="relative flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        {(['manual', 'csv'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setEntryMode(mode);
              if (mode === 'csv') setRefreshKey((k) => k + 1);
            }}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              entryMode === mode ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {entryMode === mode && (
              <motion.span
                layoutId="portfolio-entry-pill"
                className="absolute inset-0 rounded-md bg-white dark:bg-slate-900 shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{mode === 'manual' ? 'Manual Entry' : 'CSV Upload'}</span>
          </button>
        ))}
      </div>

      {entryMode === 'manual' ? (
        <ManualHoldingEntry onSuccess={() => setRefreshKey(k => k + 1)} />
      ) : (
        <CsvUpload onSuccess={() => setRefreshKey(k => k + 1)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <PortfolioSectorChart key={refreshKey} />
        </div>
      </div>

      <HoldingsList key={refreshKey} onRequestAdd={() => setEntryMode('manual')} />
    </div>
  );
}
