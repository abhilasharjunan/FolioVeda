/**
 * Pure calculation engine for the SWP (Systematic Withdrawal Plan) calculator.
 * No DB or network — unit-testable and reusable from UI.
 *
 * Convention: corpus compounds during the month, then the withdrawal is taken
 * at month-end (ordinary annuity), matching common Indian SWP planners.
 */

export interface SWPYearlyBreakdown {
  year: number;
  monthlyWithdrawal: number;
  withdrawnThisYear: number;
  cumulativeWithdrawn: number;
  valueAtYearEnd: number;
}

export interface SWPResult {
  /** Corpus remaining after the planned period (0 if depleted earlier). */
  remainingValue: number;
  totalWithdrawn: number;
  /** Starting corpus − remaining + total market growth implied by the path (not used for display). */
  monthsLasted: number;
  depleted: boolean;
  yearlyBreakdown: SWPYearlyBreakdown[];
}

export interface SWPParams {
  /** Starting corpus (₹). */
  corpus: number;
  monthlyWithdrawal: number;
  annualReturnPercent: number;
  years: number;
  /** Annual % increase applied to the monthly withdrawal at the start of each year. Default 0. */
  stepUpPercent?: number;
}

export function calculateSWP(params: SWPParams): SWPResult {
  const { corpus, monthlyWithdrawal, annualReturnPercent, years } = params;
  const stepUpPercent = params.stepUpPercent ?? 0;

  if (corpus <= 0 || monthlyWithdrawal <= 0 || years <= 0) {
    return {
      remainingValue: Math.max(0, corpus),
      totalWithdrawn: 0,
      monthsLasted: 0,
      depleted: corpus <= 0,
      yearlyBreakdown: [],
    };
  }

  const monthlyRate = annualReturnPercent / 100 / 12;
  const yearlyBreakdown: SWPYearlyBreakdown[] = [];

  let value = corpus;
  let cumulativeWithdrawn = 0;
  let currentWithdrawal = monthlyWithdrawal;
  let monthsLasted = 0;
  let depleted = false;

  for (let year = 1; year <= years; year++) {
    let withdrawnThisYear = 0;
    const withdrawalAtYearStart = currentWithdrawal;

    for (let month = 1; month <= 12; month++) {
      if (value <= 0) {
        depleted = true;
        break;
      }
      value *= 1 + monthlyRate;
      const take = Math.min(currentWithdrawal, value);
      value -= take;
      withdrawnThisYear += take;
      cumulativeWithdrawn += take;
      monthsLasted += 1;
      if (value <= 1e-9) {
        value = 0;
        depleted = true;
        break;
      }
    }

    yearlyBreakdown.push({
      year,
      monthlyWithdrawal: withdrawalAtYearStart,
      withdrawnThisYear,
      cumulativeWithdrawn,
      valueAtYearEnd: value,
    });

    if (depleted) break;
    currentWithdrawal *= 1 + stepUpPercent / 100;
  }

  return {
    remainingValue: value,
    totalWithdrawn: cumulativeWithdrawn,
    monthsLasted,
    depleted,
    yearlyBreakdown,
  };
}

/**
 * Maximum flat monthly withdrawal that exhausts the corpus over `years`
 * (ordinary annuity / end-of-month withdrawals after growth).
 */
export function calculateMaxMonthlySWP(
  corpus: number,
  annualReturnPercent: number,
  years: number
): number {
  if (corpus <= 0 || years <= 0) return 0;
  const monthlyRate = annualReturnPercent / 100 / 12;
  const n = years * 12;

  if (monthlyRate === 0) return corpus / n;

  return (corpus * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

export interface SWPScenarioInput {
  label: string;
  corpus: number;
  monthlyWithdrawal: number;
  annualReturnPercent: number;
  years: number;
  stepUpPercent?: number;
}

export interface SWPScenarioResult extends SWPResult {
  label: string;
  annualReturnPercent: number;
  years: number;
  corpus: number;
  monthlyWithdrawal: number;
}

export function compareSWPScenarios(scenarios: SWPScenarioInput[]): SWPScenarioResult[] {
  return scenarios.map((s) => ({
    label: s.label,
    annualReturnPercent: s.annualReturnPercent,
    years: s.years,
    corpus: s.corpus,
    monthlyWithdrawal: s.monthlyWithdrawal,
    ...calculateSWP(s),
  }));
}
