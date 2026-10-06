"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-full">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Something went wrong</h1>
        <p className="text-slate-500 dark:text-slate-300 leading-relaxed">
          We encountered an unexpected error while loading this page. You can try again or go back home.
        </p>
        {process.env.NODE_ENV === "development" && error?.message ? (
          <p className="mt-3 text-xs font-mono text-red-600 dark:text-red-400 break-words">{error.message}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="bg-teal-600 hover:bg-teal-500 text-white px-8">
          Try Again
        </Button>
        <Button
          variant="outline"
          className="px-8"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Home
        </Button>
      </div>
    </div>
  );
}
