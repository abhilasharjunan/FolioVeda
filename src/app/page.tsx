"use client";

import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { ShieldCheck, TrendingUp, Lock } from 'lucide-react';
import { FadeIn, PageSection, StaggerChildren, StaggerItem } from '@/components/animations';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#1a3a3633_0%,_transparent_55%),linear-gradient(180deg,#0d1219_0%,#101820_50%,#0e151c_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgb(148_163_184_/_0.12)_1px,transparent_0)] [background-size:28px_28px]" />

      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight font-heading">
          Folio<span className="text-teal-400">Veda</span>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <ThemeToggle />
          <Link
            href="/tools/sip-calculator"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-slate-300 hover:text-white hover:bg-slate-800/60')}
          >
            SIP Calculator
          </Link>
          <Link
            href="/about"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-slate-300 hover:text-white hover:bg-slate-800/60')}
          >
            About
          </Link>
          <Link
            href="/auth/signin"
            prefetch
            className={cn(buttonVariants({ variant: 'ghost' }), 'text-slate-300 hover:text-white hover:bg-slate-800/60')}
          >
            Login
          </Link>
          <Link
            href="/auth/signin"
            prefetch
            className={cn(buttonVariants({ variant: 'default' }), 'bg-teal-600 hover:bg-teal-500 text-white')}
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 min-h-[78vh] flex flex-col justify-center text-center">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400/90 mb-4">
            Mutual fund portfolio analyzer
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-50 mb-6 tracking-tight font-heading leading-[1.05]">
            Folio<span className="text-teal-400">Veda</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-slate-200 mb-4">
            Your mutual fund portfolio, analyzed with precision.
          </p>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Professional-grade XIRR tracking, allocation insights, and SEBI-aware risk views — built for Indian mutual fund investors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              prefetch
              className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'bg-teal-600 hover:bg-teal-500 text-white px-8 py-6 text-lg')}
            >
              Start Analyzing Free
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800/60"
              onClick={scrollToFeatures}
            >
              How it Works
            </Button>
          </div>
        </FadeIn>
      </section>

      <PageSection id="features" className="max-w-7xl mx-auto px-6 pb-28 scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-50 font-heading">Built for clarity</h2>
          <p className="text-slate-400 mt-2">The essentials that make portfolio decisions easier.</p>
        </div>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left" stagger={0.06}>
          <StaggerItem>
            <FeatureCard
              icon={<TrendingUp className="text-teal-400" />}
              title="Precision XIRR"
              desc="Accurate Internal Rate of Return calculations considering your exact transaction dates."
            />
          </StaggerItem>
          <StaggerItem>
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" />}
              title="SEBI Aware"
              desc="Risk-o-meters and disclaimers aligned with Indian mutual fund disclosure norms."
            />
          </StaggerItem>
          <StaggerItem>
            <FeatureCard
              icon={<Lock className="text-slate-300" />}
              title="Private by Design"
              desc="Your holdings stay behind your account — no public sharing of portfolio data."
            />
          </StaggerItem>
        </StaggerChildren>
      </PageSection>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 surface-card rounded-2xl hover:shadow-md transition-shadow">
      <div className="mb-4 p-3 bg-slate-800/60 w-fit rounded-xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-50 mb-2 font-heading">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
