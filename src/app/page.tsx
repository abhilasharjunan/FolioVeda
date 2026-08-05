"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, TrendingUp, Lock } from 'lucide-react';
import { FadeIn } from '@/components/animations';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          Folio<span className="text-blue-600">Veda</span>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Button
            variant="ghost"
            className="text-slate-600"
            onClick={() => router.push('/tools/sip-calculator')}
          >
            SIP Calculator
          </Button>
          <Button variant="ghost" onClick={() => router.push('/auth/signin')}>Login</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105" onClick={() => router.push('/auth/signin')}>Get Started</Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <FadeIn>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Your Mutual Fund Portfolio <br />
            <span className="text-blue-600">Analyzed with Precision.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Experience professional-grade XIRR tracking, asset allocation analysis, 
            and SEBI-compliant insights. No guesswork, just data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg transition-all hover:scale-105 active:scale-95" onClick={() => router.push('/auth/signin')}>
              Start Analyzing Free
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg transition-all hover:bg-white" onClick={scrollToFeatures}>
              How it Works
            </Button>
          </div>
        </FadeIn>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left scroll-mt-24">
          <FadeIn delay={0.2}>
            <FeatureCard 
              icon={<TrendingUp className="text-blue-600" />} 
              title="Precision XIRR" 
              desc="Accurate Internal Rate of Return calculations considering your exact transaction dates." 
            />
          </FadeIn>
          <FadeIn delay={0.4}>
            <FeatureCard 
              icon={<ShieldCheck className="text-green-600" />} 
              title="SEBI Compliant" 
              desc="Adhering to Indian regulatory standards for risk-o-meters and investment disclaimers." 
            />
          </FadeIn>
          <FadeIn delay={0.6}>
            <FeatureCard 
              icon={<Lock className="text-indigo-600" />} 
              title="Bank-Grade Security" 
              desc="Row-level security and UUID masking to ensure your financial data never leaks." 
            />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="mb-4 p-3 bg-slate-50 w-fit rounded-xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
