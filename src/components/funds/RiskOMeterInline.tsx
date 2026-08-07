import React from 'react';

interface RiskOMeterInlineProps {
  level: 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderate to High' | 'High' | 'Very High';
}

const levels = ['Low', 'Low to Moderate', 'Moderate', 'Moderate to High', 'High', 'Very High'];
const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-red-600'];

export const RiskOMeterInline = ({ level }: RiskOMeterInlineProps) => {
  const index = levels.indexOf(level);
  
  return (
    <div className="flex items-center gap-2 w-full max-w-[120px]">
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
        {colors.map((color, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 ${color} transition-opacity ${i === index ? 'opacity-100' : 'opacity-20'}`} 
          />
        ))}
      </div>
      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[60px]">{level}</span>
    </div>
  );
};
