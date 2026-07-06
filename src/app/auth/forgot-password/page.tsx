"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/animations';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <FadeIn>
        <Card className="w-full max-w-md border-none shadow-xl bg-white">
          <CardHeader className="text-center pb-0">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="text-blue-600" size={24} />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Forgot Password</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link.</p>
          </CardHeader>
          <CardContent className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-green-500" />
                <p className="text-sm text-slate-600">Check your inbox. If an account exists with that email, you'll receive a reset link shortly.</p>
                <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Email Address</label>
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
                  <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}
                <Button type="submit" disabled={loading || !email} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                  {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </Button>
                <div className="text-center">
                  <Link href="/auth/signin" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                    <ArrowLeft size={14} /> Back to Sign In
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
