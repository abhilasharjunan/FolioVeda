"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/animations';
import { Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : 'Invalid or missing reset token.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setDone(true);
      setTimeout(() => router.push('/auth/signin'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <FadeIn>
        <Card className="w-full max-w-md border-none shadow-xl bg-white">
          <CardHeader className="text-center pb-0">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-blue-600" size={24} />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-green-500" />
                <p className="text-sm text-slate-600">Password updated! Redirecting to sign in...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">New Password</label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="w-full"
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}
                <Button type="submit" disabled={loading || !token || !password || !confirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                  {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Resetting...</> : 'Reset Password'}
                </Button>
                <div className="text-center">
                  <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><Loader2 size={24} className="animate-spin text-blue-600" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
