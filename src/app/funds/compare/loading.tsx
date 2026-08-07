import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function CompareFundsLoading() {
  return (
    <div className="px-4 py-6 sm:p-6 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-96" />
      </div>
      <SkeletonText className="h-12 w-full max-w-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonChart height="h-64" />
    </div>
  );
}
