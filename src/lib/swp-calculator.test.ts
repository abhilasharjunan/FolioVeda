import { describe, it, expect } from 'vitest';
import {
  calculateSWP,
  calculateMaxMonthlySWP,
  compareSWPScenarios,
} from './swp-calculator';

describe('calculateSWP', () => {
  it('withdraws roughly monthlyAmount * months when return is zero', () => {
    const result = calculateSWP({
      corpus: 120000,
      monthlyWithdrawal: 10000,
      annualReturnPercent: 0,
      years: 1,
    });
    expect(result.totalWithdrawn).toBeCloseTo(120000, 2);
    expect(result.remainingValue).toBeCloseTo(0, 2);
    expect(result.depleted).toBe(true);
    expect(result.monthsLasted).toBe(12);
  });

  it('leaves remaining corpus when withdrawals are sustainable', () => {
    const result = calculateSWP({
      corpus: 50_00_000,
      monthlyWithdrawal: 20000,
      annualReturnPercent: 10,
      years: 10,
    });
    expect(result.depleted).toBe(false);
    expect(result.remainingValue).toBeGreaterThan(0);
    expect(result.totalWithdrawn).toBeCloseTo(20000 * 12 * 10, 0);
    expect(result.yearlyBreakdown).toHaveLength(10);
  });

  it('depletes early when withdrawal is too aggressive', () => {
    const result = calculateSWP({
      corpus: 100000,
      monthlyWithdrawal: 50000,
      annualReturnPercent: 8,
      years: 10,
    });
    expect(result.depleted).toBe(true);
    expect(result.monthsLasted).toBeLessThan(120);
    expect(result.remainingValue).toBe(0);
  });

  it('step-up SWP withdraws more than a flat SWP', () => {
    const flat = calculateSWP({
      corpus: 50_00_000,
      monthlyWithdrawal: 25000,
      annualReturnPercent: 10,
      years: 15,
    });
    const stepped = calculateSWP({
      corpus: 50_00_000,
      monthlyWithdrawal: 25000,
      annualReturnPercent: 10,
      years: 15,
      stepUpPercent: 5,
    });
    expect(stepped.totalWithdrawn).toBeGreaterThan(flat.totalWithdrawn);
    expect(stepped.yearlyBreakdown[1].monthlyWithdrawal).toBeCloseTo(26250, 0);
  });

  it('returns zeroed withdrawals for non-positive inputs', () => {
    expect(
      calculateSWP({ corpus: 0, monthlyWithdrawal: 10000, annualReturnPercent: 10, years: 5 }).totalWithdrawn
    ).toBe(0);
    expect(
      calculateSWP({ corpus: 100000, monthlyWithdrawal: 0, annualReturnPercent: 10, years: 5 }).totalWithdrawn
    ).toBe(0);
  });
});

describe('calculateMaxMonthlySWP', () => {
  it('is the inverse of calculateSWP for a flat withdrawal over the full period', () => {
    const corpus = 25_00_000;
    const annualReturnPercent = 9;
    const years = 20;

    const maxMonthly = calculateMaxMonthlySWP(corpus, annualReturnPercent, years);
    const result = calculateSWP({
      corpus,
      monthlyWithdrawal: maxMonthly,
      annualReturnPercent,
      years,
    });

    // Should nearly exhaust the corpus over the horizon
    expect(result.remainingValue).toBeLessThan(corpus * 0.02);
    expect(result.monthsLasted).toBe(years * 12);
  });

  it('handles a zero return rate as simple division', () => {
    expect(calculateMaxMonthlySWP(120000, 0, 10)).toBeCloseTo(1000, 4);
  });
});

describe('compareSWPScenarios', () => {
  it('runs multiple assumption sets and returns one result per scenario', () => {
    const results = compareSWPScenarios([
      { label: 'Lean', corpus: 50_00_000, monthlyWithdrawal: 20000, annualReturnPercent: 8, years: 15 },
      { label: 'Base', corpus: 50_00_000, monthlyWithdrawal: 30000, annualReturnPercent: 8, years: 15 },
      { label: 'High', corpus: 50_00_000, monthlyWithdrawal: 50000, annualReturnPercent: 8, years: 15 },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].totalWithdrawn).toBeLessThan(results[1].totalWithdrawn);
    expect(results[2].remainingValue).toBeLessThanOrEqual(results[0].remainingValue);
  });
});
