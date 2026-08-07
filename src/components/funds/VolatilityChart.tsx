import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VolatilityChartProps {
  data: { date: string; value: number }[];
}

export const VolatilityChart = ({ data }: VolatilityChartProps) => {
  if (!data?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-slate-400 dark:text-slate-400">
        No volatility history yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
             labelStyle={{ color: '#64748b' }}
             contentStyle={{
               borderRadius: '10px',
               border: 'none',
               boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
               background: 'hsl(var(--card))',
             }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            fillOpacity={1}
            fill="url(#colorVol)"
            strokeWidth={2}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
