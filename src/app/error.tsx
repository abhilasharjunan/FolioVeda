"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="p-4 bg-red-50 rounded-full">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Something went wrong</h1>
        <p className="text-slate-500 dark:text-slate-300 leading-relaxed">
          We encountered an unexpected error while processing your portfolio. 
          Our team has been notified.
        </p>
      </div>
      <Button 
        onClick={() => reset()} 
        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
      >
        Try Again
      </Button>
    </div>
  );
}
