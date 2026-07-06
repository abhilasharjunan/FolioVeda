"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User } from 'lucide-react';
import { FadeIn } from '@/components/animations';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isLogin) {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } else {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        setIsLogin(true);
        setError('Account created! Please sign in.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <FadeIn>
        <Card className="w-full max-w-md border-none shadow-xl bg-white">
          <CardHeader className="text-center space-y-2">
            <div className="text-3xl font-bold text-slate-900">
              Folio<span className="text-blue-600">Veda</span>
            </div>
            <CardTitle className="text-lg font-medium text-slate-500">
              {isLogin ? 'Welcome back' : 'Create your secure account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <User size={14} /> Full Name
                  </label>
                  <Input 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <Mail size={14} /> Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <Lock size={14} /> Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required 
                />
              </div>

              {error && (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6" 
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>

              {isLogin && (
                <div className="text-center">
                  <a href="/auth/forgot-password" className="text-xs text-slate-500 hover:text-blue-600 font-medium">
                    Forgot password?
                  </a>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
