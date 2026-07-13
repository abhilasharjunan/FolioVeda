import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function PortfolioOverlapLoading() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <SkeletonText className="h-4 w-40" />
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-96" />
      </div>
      <SkeletonCard className="h-20" />
      <SkeletonChart height="h-[400px]" />
    </div>
  );
}
