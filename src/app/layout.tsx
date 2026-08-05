import React from 'react';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import { SEBIFooter } from '@/components/shared/SEBIFooter';
import { Providers } from '@/components/providers';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col bg-white text-slate-900">
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <SEBIFooter />
        </Providers>
      </body>
    </html>
  );
}
