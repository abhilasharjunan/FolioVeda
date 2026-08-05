import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function PortfolioLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-80" />
      </div>
      <SkeletonText className="h-10 w-48" />
      <SkeletonCard className="h-64" />
      <SkeletonChart height="h-64" />
      <SkeletonCard className="h-48" />
    </div>
  );
}
