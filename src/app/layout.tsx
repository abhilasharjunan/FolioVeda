import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import { SEBIFooter } from '@/components/shared/SEBIFooter';
import { Providers } from '@/components/providers';
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'FolioVeda',
  description: 'Mutual fund portfolio analyzer for Indian investors',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark font-sans", plusJakarta.variable, outfit.variable)} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
        <Providers>
          <Navbar />
          <main className="flex-grow page-shell min-w-0">
            {children}
          </main>
          <SEBIFooter />
        </Providers>
      </body>
    </html>
  );
}
