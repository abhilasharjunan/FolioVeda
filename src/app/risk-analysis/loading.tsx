import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function RiskAnalysisLoading() {
  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonText className="h-8 w-64" />
          <SkeletonText className="h-4 w-96" />
        </div>
        <SkeletonText className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
      <SkeletonChart height="h-[600px]" />
    </div>
  );
}
