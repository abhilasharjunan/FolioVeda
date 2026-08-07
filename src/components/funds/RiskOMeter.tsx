import React from 'react';

interface RiskOMeterProps {
  level: 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderate to High' | 'High' | 'Very High';
}

const levels = ['Low', 'Low to Moderate', 'Moderate', 'Moderate to High', 'High', 'Very High'];
const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-red-600'];

export const RiskOMeter = ({ level }: RiskOMeterProps) => {
  const index = levels.indexOf(level);
  
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-300 font-medium px-1">
        <span>LOW</span>
        <span>VERY HIGH</span>
      </div>
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
        {colors.map((color, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 ${color} transition-opacity ${i === index ? 'opacity-100 ring-2 ring-white/80 dark:ring-slate-900 ring-inset' : 'opacity-30'}`} 
          />
        ))}
      </div>
      <div className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
        Risk Level: <span className="text-slate-900 dark:text-slate-50">{level}</span>
      </div>
    </div>
  );
};
