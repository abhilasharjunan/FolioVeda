import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function PortfolioRiskLoading() {
  return (
    <div className="px-4 py-6 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="h-8 w-64" />
          <SkeletonText className="h-4 w-96" />
        </div>
        <SkeletonText className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
      <SkeletonChart height="h-[300px]" />
      <SkeletonChart height="h-[400px]" />
    </div>
  );
}
