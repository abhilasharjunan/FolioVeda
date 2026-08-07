import React from 'react';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import { SEBIFooter } from '@/components/shared/SEBIFooter';
import { Providers } from '@/components/providers';
import { DM_Sans, Sora } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", dmSans.variable, sora.variable)} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-grow page-shell">
            {children}
          </main>
          <SEBIFooter />
        </Providers>
      </body>
    </html>
  );
}
