import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const mockUsePathname = vi.mocked(usePathname);
const mockUseSession = vi.mocked(useSession);

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScaleIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SlideIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Navbar from './Navbar';

const authedSession = {
  data: { user: { email: 'test@example.com' }, expires: '2099-01-01' },
  status: 'authenticated' as const,
  update: vi.fn(),
};

const guestSession = {
  data: null,
  status: 'unauthenticated' as const,
  update: vi.fn(),
};

describe('Navbar', () => {
  beforeEach(() => {
    cleanup();
    mockUseSession.mockReturnValue(authedSession as ReturnType<typeof useSession>);
  });

  it('returns null on home page', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<Navbar />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null on auth pages', () => {
    mockUsePathname.mockReturnValue('/auth/signin');
    const { container } = render(<Navbar />);
    expect(container.innerHTML).toBe('');
  });

  it('renders authenticated nav links on dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Navbar />);
    expect(within(container).getByText('Dashboard')).toBeTruthy();
    expect(within(container).getByText('Portfolio')).toBeTruthy();
    expect(within(container).getByText('Logout')).toBeTruthy();
    expect(within(container).queryByText('Sign in')).toBeNull();
  });

  it('renders portfolio sub-nav with Report on portfolio routes', () => {
    mockUsePathname.mockReturnValue('/portfolio');
    const { container } = render(<Navbar />);
    expect(within(container).getByText('Holdings')).toBeTruthy();
    expect(within(container).getByText('Risk')).toBeTruthy();
    expect(within(container).getByText('Overlap')).toBeTruthy();
    expect(within(container).getByText('Report')).toBeTruthy();
    expect(within(container).getByText('Compare')).toBeTruthy();
    expect(within(container).getByText('Top Funds')).toBeTruthy();
  });

  it('highlights only the longest-matching portfolio sub-link', () => {
    mockUsePathname.mockReturnValue('/portfolio/risk');
    const { container } = render(<Navbar />);
    const risk = within(container).getByRole('button', { name: 'Risk' });
    const holdings = within(container).getByRole('button', { name: 'Holdings' });
    expect(risk.className).toContain('bg-blue-50');
    expect(holdings.className).not.toContain('bg-blue-50');
    // Primary Portfolio stays active for any /portfolio/* route
    const portfolio = within(container).getByRole('button', { name: 'Portfolio' });
    expect(portfolio.className).toContain('bg-blue-50');
  });

  it('shows public links and Sign in when unauthenticated', () => {
    mockUseSession.mockReturnValue(guestSession as ReturnType<typeof useSession>);
    mockUsePathname.mockReturnValue('/about');
    const { container } = render(<Navbar />);
    expect(within(container).getByText('About')).toBeTruthy();
    expect(within(container).getByText('SIP Calculator')).toBeTruthy();
    expect(within(container).getByText('Sign in')).toBeTruthy();
    expect(within(container).queryByText('Dashboard')).toBeNull();
    expect(within(container).queryByText('Logout')).toBeNull();
  });
});
