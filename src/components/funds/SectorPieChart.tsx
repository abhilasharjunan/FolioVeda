'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SectorPieChartProps {
  data: Record<string, number>;
}

const COLORS = [
  "hsl(160 84% 39%)",
  "hsl(239 84% 67%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
  "hsl(199 89% 48%)",
  "#64748b",
  "#94a3b8",
  "#0ea5e9",
];

export const SectorPieChart = ({ data }: SectorPieChartProps) => {
  const formattedData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (formattedData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-400 dark:text-slate-400">
        No sector data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={700}
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Allocation']}
            contentStyle={{
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={56}
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", lineHeight: "1.35", paddingTop: "8px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
