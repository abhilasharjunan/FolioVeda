"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small plain-language explainer for fintech jargon (Sharpe, Sortino, HHI, beta,
 * alpha, R-squared, etc). Fintech tools that show ratios without explanation
 * read as untrustworthy — this puts a one-line definition one hover/tap away
 * instead of requiring users to look it up elsewhere.
 * See FolioVeda_Audit_and_Roadmap.md, Phase 2: "Explain the jargon in place."
 */
export function InfoTooltip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          className={cn(
            "inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors align-middle cursor-help",
            className
          )}
          aria-label="More information"
        >
          <Info size={13} />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner sideOffset={8} className="z-50">
            <TooltipPrimitive.Popup className="max-w-[240px] rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
              {children}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/** Convenience wrapper: a label plus its info icon, laid out inline. */
export function MetricLabel({ label, tooltip }: { label: string; tooltip: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <InfoTooltip>{tooltip}</InfoTooltip>
    </span>
  );
}

/** Shared plain-language copy for the metrics that show up across risk pages. */
export const METRIC_EXPLANATIONS: Record<string, string> = {
  sharpeRatio: "Return earned per unit of total risk taken. Higher is generally better — above 1 is considered good, above 2 is very good.",
  sortinoRatio: "Like Sharpe, but only penalizes downside volatility (bad swings), not upside. Higher is better.",
  volatility: "How much the fund's returns swing up and down over a year (annualized). Lower means steadier, more predictable returns.",
  maxDrawdown: "The largest drop from a peak to a low point historically. Shows the worst-case loss an investor would have experienced.",
  beta: "Sensitivity to the broader market. 1.0 moves with the market; above 1 is more volatile than the market, below 1 is less.",
  alpha: "Excess return versus what beta alone would predict — a rough measure of the fund's skill beyond just tracking the market.",
  rSquared: "How much of the fund's movement is explained by the benchmark (0-100%). Higher means it behaves more like an index fund.",
  treynorRatio: "Return earned per unit of market risk (beta), rather than total risk. Useful for comparing well-diversified funds.",
  hhi: "Herfindahl-Hirschman Index — a concentration measure. Closer to 0 means spread across many holdings/categories; closer to 1 means concentrated in few.",
  concentrationRisk: "How concentrated the fund's top disclosed holdings are (HHI). Higher means the fund's returns depend heavily on a few stocks.",
  sectorConcentration: "The combined weight of the fund's top 3 sectors among its disclosed holdings. Higher means less sector diversification.",
  overlapPercentage: "Weighted overlap between two funds' top disclosed holdings — the share of stocks (by allocation) they both hold.",
  compositeScore: "A 0-100 risk exposure score. Higher means riskier. Volatility and drawdown raise it; stronger Sharpe/Sortino/alpha lower it.",
  diversificationScore: "0-100 score based on how evenly your holdings are spread across fund categories (via HHI). Higher means better diversified.",
  xirr: "Extended Internal Rate of Return — your annualized return accounting for the exact dates and sizes of every investment and withdrawal.",
};
