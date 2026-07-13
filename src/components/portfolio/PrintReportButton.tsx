"use client";

import { Download } from "lucide-react";

/**
 * PDF export without adding a PDF-generation dependency: the report page is
 * laid out with print-friendly CSS (see globals.css @page rule, and
 * `print:hidden` on Navbar/SEBIFooter), and this button triggers the browser's
 * native print dialog, where "Save as PDF" produces a clean document. Works
 * in every browser with zero added dependencies or server-side rendering cost.
 */
export function PrintReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
    >
      <Download size={14} />
      Download PDF Report
    </button>
  );
}
