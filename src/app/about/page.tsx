"use client";

import React from 'react';
import { Info } from 'lucide-react';
import packageJson from '../../../package.json';

export default function AboutPage() {
  const version = packageJson.version;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Info className="text-blue-600" size={28} />
            <h1 className="text-3xl font-bold text-slate-900">About FolioVeda</h1>
          </div>

          {/* Version Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Version</p>
                <p className="text-3xl font-bold text-blue-900">{version}</p>
              </div>
              <div className="text-right text-xs text-blue-600">
                <p>Latest Build</p>
                <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* About Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">What is FolioVeda?</h2>
              <p className="text-slate-600 leading-relaxed">
                FolioVeda is your comprehensive Indian mutual fund portfolio management platform. Analyze your investments, track performance, and make data-driven decisions with our advanced tools.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Features</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-600">Portfolio Tracking & Analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-600">Risk Assessment & Ratings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-600">Fund Comparison & Overlap Detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-600">Top Funds Discovery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-slate-600">SIP Calculator</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Compliance</h2>
              <p className="text-slate-600 leading-relaxed">
                FolioVeda is committed to regulatory compliance and data security. We follow SEBI guidelines and best practices in financial data handling.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                © 2025 FolioVeda. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
