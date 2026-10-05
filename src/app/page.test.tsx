import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScaleIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PageSection: ({ children, id, className }: { children: React.ReactNode; id?: string; className?: string }) => (
    <section id={id} className={className}>{children}</section>
  ),
  StaggerChildren: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AnimatedNumber: ({ value, suffix = '' }: { value: number; suffix?: string; format?: (n: number) => string; decimals?: number }) => (
    <span>{value}{suffix}</span>
  ),
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button" aria-label="Toggle theme">Theme</button>,
}));

import LandingPage from './page';

describe('LandingPage', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    expect(() => render(<LandingPage />)).not.toThrow();
  });

  it('shows branding', () => {
    render(<LandingPage />);
    const brand = screen.getAllByText(/Folio/i);
    expect(brand.length).toBeGreaterThan(0);
  });

  it('has login and get started buttons', () => {
    render(<LandingPage />);
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Started').length).toBeGreaterThan(0);
  });

  it('includes feature showcase section', () => {
    render(<LandingPage />);
    expect(document.getElementById('features')).toBeTruthy();
    expect(screen.getAllByText('Inside FolioVeda').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hidden duplication across funds/i).length).toBeGreaterThan(0);
  });
});
