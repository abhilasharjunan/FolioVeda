"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ScaleIn } from '@/components/animations';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Reset access to your FolioVeda account">
      <Card className="w-full border-none shadow-xl surface-card">
        <CardHeader className="text-center pb-0">
          <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-teal-950/50 rounded-full flex items-center justify-center mb-4">
            <Mail className="text-teal-600 dark:text-teal-400" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">Forgot Password</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your email and we&apos;ll send you a reset link.</p>
        </CardHeader>
        <CardContent className="p-8">
          {sent ? (
            <ScaleIn>
              <div className="text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Check your inbox. If an account exists with that email, you&apos;ll receive a reset link shortly.
                </p>
                <Link href="/auth/signin" className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-500 font-medium inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </ScaleIn>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <Button type="submit" disabled={loading || !email} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-6">
                {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <Link href="/auth/signin" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
