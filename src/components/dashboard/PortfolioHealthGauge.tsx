"use client";

import { ProgressCircle } from "@/components/ui/ProgressCircle";
import { MetricLabel, METRIC_EXPLANATIONS } from "@/components/ui/InfoTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioHealthGaugeProps {
  diversificationScore: number | null; // 0-100, higher = better
  riskScore: number | null; // 0-100, higher = riskier
}

/**
 * A single, consolidated 0-100 "Portfolio Health" score, replacing the previous
 * pattern of showing diversification score and risk score as separate numbers
 * computed on separate pages. This is the highest-leverage visual change called
 * out in the audit report (Phase 2, "One portfolio health score, visually
 * anchored") — a Tickertape/Groww-style health gauge anchoring the dashboard.
 *
 * Health = average of diversification score and (100 - risk score), so higher
 * is always better for the combined number, even though the two inputs point
 * in opposite directions individually.
 */
export function PortfolioHealthGauge({ diversificationScore, riskScore }: PortfolioHealthGaugeProps) {
  const hasDiversification = diversificationScore != null;
  const hasRisk = riskScore != null;

  if (!hasDiversification && !hasRisk) return null;

  const safetyScore = hasRisk ? 100 - (riskScore as number) : null;
  const healthScore = Math.round(
    hasDiversification && hasRisk
      ? ((diversificationScore as number) + (safetyScore as number)) / 2
      : hasDiversification
      ? (diversificationScore as number)
      : (safetyScore as number)
  );

  const color = healthScore >= 70 ? '#16a34a' : healthScore >= 45 ? '#f59e0b' : '#dc2626';
  const verdict =
    healthScore >= 70
      ? 'Healthy — well diversified with manageable risk.'
      : healthScore >= 45
      ? 'Fair — some room to improve diversification or reduce risk concentration.'
      : 'Needs attention — your portfolio is either concentrated, high-risk, or both.';

  return (
    <Card className="surface-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-heading">
          <MetricLabel label="Portfolio Health Score" tooltip="A single 0-100 score combining how well-diversified your portfolio is and how much risk it carries. Higher is always better." />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <ProgressCircle progress={healthScore} size={120} color={color} />
        <div className="flex-1 space-y-3 w-full">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{verdict}</p>
          <div className="space-y-2">
            {hasDiversification && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-300">
                  <MetricLabel label="Diversification" tooltip={METRIC_EXPLANATIONS.diversificationScore} />
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{diversificationScore}/100</span>
              </div>
            )}
            {hasRisk && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-300">
                  <MetricLabel label="Risk Exposure" tooltip={METRIC_EXPLANATIONS.compositeScore} />
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{Math.round(riskScore as number)}/100</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
