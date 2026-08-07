import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScaleIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/auth/AuthShell', () => ({
  AuthShell: ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
    <div>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import AuthPage from './page';

describe('AuthPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<AuthPage />)).not.toThrow();
  });

  it('shows sign in form by default', () => {
    render(<AuthPage />);
    const titles = screen.getAllByText('Welcome back');
    expect(titles.length).toBeGreaterThan(0);
    const buttons = screen.getAllByText('Sign In');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows email and password inputs', () => {
    render(<AuthPage />);
    const emails = screen.getAllByPlaceholderText('name@company.com');
    expect(emails.length).toBeGreaterThan(0);
    const passwords = screen.getAllByPlaceholderText('••••••••');
    expect(passwords.length).toBeGreaterThan(0);
  });

  it('has forgot password link', () => {
    render(<AuthPage />);
    const links = screen.getAllByText('Forgot password?');
    expect(links.length).toBeGreaterThan(0);
  });

  it('can toggle to signup mode', () => {
    render(<AuthPage />);
    const toggles = screen.getAllByText(/Need an account\? Sign up/);
    expect(toggles.length).toBeGreaterThan(0);
  });
});
