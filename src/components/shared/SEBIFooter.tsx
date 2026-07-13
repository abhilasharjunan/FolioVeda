import React from 'react';
import { AlertCircle } from 'lucide-react';

export const SEBIFooter = () => {
  return (
    <footer className="print:hidden border-t bg-slate-50 py-6 px-4 text-center text-xs text-slate-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2 text-slate-600 font-medium">
          <AlertCircle size={14} />
          <span>SEBI Regulatory Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          Disclaimer: FolioVeda is a portfolio analytics tool and does not provide investment advice. 
          Mutual Fund investments are subject to market risks; read all scheme related documents carefully. 
          All NAV data is sourced from third-party providers (AMFI/mfapi.in) and may have a reporting lag. 
          Past performance is not indicative of future results.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} FolioVeda. All rights reserved.</p>
      </div>
    </footer>
  );
};
