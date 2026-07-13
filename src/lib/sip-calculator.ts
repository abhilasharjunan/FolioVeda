/**
 * Pure calculation engine for the SIP calculator and forward-projection
 * scenario tool (same engine, per audit follow-up items 3 & 15) — no DB or
 * network calls, so this is trivially unit-testable and reusable from both UI
 * surfaces.
 *
 * Convention: SIP contributions are modeled as happening at the START of each
 * month (annuity due), matching how Groww/ET Money/most Indian SIP calculators
 * compute future value — a contribution made this month compounds for the
 * full month.
 */

export interface SIPYearlyBreakdown {
  year: number;
  monthlyAmount: number;
  investedThisYear: number;
  cumulativeInvested: number;
  valueAtYearEnd: number;
}

export interface SIPResult {
  futureValue: number;
  totalInvested: number;
  totalGain: number;
  yearlyBreakdown: SIPYearlyBreakdown[];
}

export interface SIPParams {
  monthlyAmount: number;
  annualReturnPercent: number;
  years: number;
  /** Annual % increase applied to the monthly contribution at the start of each year. Default 0 (flat SIP). */
  stepUpPercent?: number;
}

export function calculateSIPFutureValue(params: SIPParams): SIPResult {
  const { monthlyAmount, annualReturnPercent, years } = params;
  const stepUpPercent = params.stepUpPercent ?? 0;

  if (monthlyAmount <= 0 || years <= 0) {
    return { futureValue: 0, totalInvested: 0, totalGain: 0, yearlyBreakdown: [] };
  }

  const monthlyRate = annualReturnPercent / 100 / 12;
  const yearlyBreakdown: SIPYearlyBreakdown[] = [];

  let value = 0;
  let cumulativeInvested = 0;
  let currentMonthlyAmount = monthlyAmount;

  for (let year = 1; year <= years; year++) {
    let investedThisYear = 0;
    for (let month = 1; month <= 12; month++) {
      // Contribution at the start of the month, then grows for that month.
      value = (value + currentMonthlyAmount) * (1 + monthlyRate);
      investedThisYear += currentMonthlyAmount;
    }
    cumulativeInvested += investedThisYear;
    yearlyBreakdown.push({
      year,
      monthlyAmount: currentMonthlyAmount,
      investedThisYear,
      cumulativeInvested,
      valueAtYearEnd: value,
    });
    currentMonthlyAmount *= 1 + stepUpPercent / 100;
  }

  return {
    futureValue: value,
    totalInvested: cumulativeInvested,
    totalGain: value - cumulativeInvested,
    yearlyBreakdown,
  };
}

export function calculateLumpsumFutureValue(principal: number, annualReturnPercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return principal;
  return principal * Math.pow(1 + annualReturnPercent / 100, years);
}

/**
 * Inverse of the flat (no step-up) SIP formula: given a target corpus, what
 * flat monthly contribution is required? Uses the closed-form annuity-due
 * formula directly rather than simulation, since it's solving for the input.
 */
export function calculateRequiredMonthlySIP(targetAmount: number, annualReturnPercent: number, years: number): number {
  if (targetAmount <= 0 || years <= 0) return 0;
  const monthlyRate = annualReturnPercent / 100 / 12;
  const n = years * 12;

  if (monthlyRate === 0) return targetAmount / n;

  const growthFactor = ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
  return targetAmount / growthFactor;
}

export interface ScenarioInput {
  label: string;
  monthlyAmount: number;
  annualReturnPercent: number;
  years: number;
  stepUpPercent?: number;
}

export interface ScenarioResult extends SIPResult {
  label: string;
  annualReturnPercent: number;
  years: number;
}

/** Runs several forward-projection scenarios side by side for comparison. */
export function compareScenarios(scenarios: ScenarioInput[]): ScenarioResult[] {
  return scenarios.map((s) => ({
    label: s.label,
    annualReturnPercent: s.annualReturnPercent,
    years: s.years,
    ...calculateSIPFutureValue(s),
  }));
}
