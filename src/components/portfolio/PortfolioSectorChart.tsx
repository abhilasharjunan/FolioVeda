"use client";

import React, { useEffect, useState } from 'react';
import { SectorPieChart } from '@/components/funds/SectorPieChart';
import { ChartCard } from '@/components/ui/ChartCard';

interface SectorData {
  sectors: Record<string, number>;
  totalValue: number;
  totalSectorValue: number;
}

export default function PortfolioSectorChart() {
  const [data, setData] = useState<SectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/portfolio/sectors');
        if (!res.ok) {
          if (res.status === 401) { setData(null); return; }
          throw new Error('Failed to fetch sector data');
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchSectors();
  }, []);

  if (loading) {
    return (
      <ChartCard title="Sector Allocation" loading />
    );
  }

  if (error) {
    return (
      <ChartCard title="Sector Allocation" subtitle="Could not load sector mix">
        <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center px-4">
          {error}
        </p>
      </ChartCard>
    );
  }

  if (!data || Object.keys(data.sectors).length === 0) {
    return (
      <ChartCard
        title="Sector Allocation"
        subtitle="Look-through sectors need disclosed fund holdings"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center px-4 leading-relaxed">
          Sector mix appears once monthly portfolio holdings are available for your funds.
          Refresh the Overlap page after holdings sync to populate this chart.
        </p>
      </ChartCard>
    );
  }

  const sectorCount = Object.keys(data.sectors).length;

  return (
    <ChartCard
      title="Sector Allocation"
      subtitle={`${sectorCount} sectors across your portfolio · ₹${data.totalValue.toLocaleString('en-IN')} total`}
    >
      <SectorPieChart data={data.sectors} />
    </ChartCard>
  );
}
