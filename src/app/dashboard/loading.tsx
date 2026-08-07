import React from 'react';
import { SkeletonCard, SkeletonText, SkeletonChart } from '@/components/ui/skeletons';

export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonText className="h-8 w-64" />
          <SkeletonText className="h-4 w-72" />
        </div>
        <SkeletonText className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <SkeletonCard className="h-40" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonChart height="h-64" />
        <div className="lg:col-span-2">
          <SkeletonChart height="h-64" />
        </div>
      </div>
    </div>
  );
}
