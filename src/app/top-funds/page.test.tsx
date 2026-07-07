import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/skeletons', () => ({
  SkeletonCard: ({ className }: { className?: string }) => (
    <div className={className} data-testid="skeleton" />
  ),
  SkeletonText: ({ className }: { className?: string }) => (
    <div className={className} data-testid="skeleton" />
  ),
  SkeletonChart: ({ height }: { height?: string }) => (
    <div className={height} data-testid="skeleton" />
  ),
}));

vi.mock('@/lib/export', () => ({
  downloadCSV: vi.fn(),
}));

import TopFundsPage from './page';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify({
      "Large Cap": [],
      "Mid Cap": [],
      "Small Cap": [],
    }), { status: 200 }))
  ));
});

describe('TopFundsPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<TopFundsPage />)).not.toThrow();
  });

  it('shows skeleton loading state on mount', () => {
    render(<TopFundsPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
