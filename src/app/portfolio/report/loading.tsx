import React from 'react';
import { SkeletonCard, SkeletonText } from '@/components/ui/skeletons';

export default function PortfolioReportLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonText className="h-8 w-56" />
          <SkeletonText className="h-4 w-72" />
        </div>
        <SkeletonText className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-48" />
    </div>
  );
}
