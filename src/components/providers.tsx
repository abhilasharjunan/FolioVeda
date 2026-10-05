"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { FundDetailProvider } from "@/components/funds/FundDetailContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <FundDetailProvider>
          {children}
          <Toaster richColors position="top-right" />
        </FundDetailProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
