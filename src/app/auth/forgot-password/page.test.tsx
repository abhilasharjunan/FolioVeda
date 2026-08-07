import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/animations', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScaleIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/auth/AuthShell', () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

import ForgotPasswordPage from './page';

describe('ForgotPasswordPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<ForgotPasswordPage />)).not.toThrow();
  });

  it('shows email input form', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getAllByPlaceholderText('you@example.com').length).toBeGreaterThan(0);
  });

  it('has back to sign in link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getAllByText('Back to Sign In').length).toBeGreaterThan(0);
  });

  it('has submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getAllByText('Send Reset Link').length).toBeGreaterThan(0);
  });
});
