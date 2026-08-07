import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button" aria-label="Toggle theme">Theme</button>,
}));

import LandingPage from './page';

describe('LandingPage', () => {
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
});
