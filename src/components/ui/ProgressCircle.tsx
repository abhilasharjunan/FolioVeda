'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ProgressCircleProps {
  progress: number; // 0-100
  size?: number;
  className?: string;
}

export function ProgressCircle({ progress, size = 80, className = '' }: ProgressCircleProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    setAnimatedProgress(prev => {
      const step = (progress - prev) * 0.1;
      if (Math.abs(step) > 0.1) {
        rafRef.current = requestAnimationFrame(animate);
        return prev + step;
      }
      return progress;
    });
  }, [progress]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  const radius = size / 2 - 10; // Leave room for stroke
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className={`relative w-[{size}px] h-[{size}px] ${className}`}>
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="stroke: #e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="stroke: #3b82f6"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-900">
        {Math.round(animatedProgress)}%
      </div>
    </div>
  );
}