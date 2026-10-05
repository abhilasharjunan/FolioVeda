'use client';

import React, { use, useEffect } from 'react';
import { useOpenFundDetail } from '@/components/funds/FundDetailContext';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Deep-link entry: opens the global fund detail slide-over and keeps the user
 * on a lightweight shell (modal UX preferred over a full-page duplicate).
 */
export default function FundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const openFund = useOpenFundDetail();

  useEffect(() => {
    if (id) openFund(id);
  }, [id, openFund]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
      <PageLoader />
      <p className="text-sm text-slate-500 dark:text-slate-400">Opening fund details…</p>
    </div>
  );
}
