import { describe, it, expect } from 'vitest';
import {
  calculateSIPFutureValue,
  calculateLumpsumFutureValue,
  calculateRequiredMonthlySIP,
  compareScenarios,
} from './sip-calculator';

describe('calculateSIPFutureValue', () => {
  it('matches the closed-form annuity-due formula for a flat (no step-up) SIP', () => {
    const monthlyAmount = 5000;
    const annualReturnPercent = 12;
    const years = 5;

    const result = calculateSIPFutureValue({ monthlyAmount, annualReturnPercent, years });

    // Independently computed closed-form: FV = P * [((1+i)^n - 1)/i] * (1+i)
    const i = annualReturnPercent / 100 / 12;
    const n = years * 12;
    const expectedFV = monthlyAmount * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));

    expect(result.futureValue).toBeCloseTo(expectedFV, 2);
    expect(result.totalInvested).toBeCloseTo(monthlyAmount * n, 2);
    expect(result.totalGain).toBeCloseTo(expectedFV - monthlyAmount * n, 2);
  });

  it('produces a yearly breakdown with cumulative invested growing linearly for a flat SIP', () => {
    const result = calculateSIPFutureValue({ monthlyAmount: 1000, annualReturnPercent: 10, years: 3 });
    expect(result.yearlyBreakdown).toHaveLength(3);
    expect(result.yearlyBreakdown[0].cumulativeInvested).toBeCloseTo(12000, 2);
    expect(result.yearlyBreakdown[1].cumulativeInvested).toBeCloseTo(24000, 2);
    expect(result.yearlyBreakdown[2].cumulativeInvested).toBeCloseTo(36000, 2);
    // value should be monotonically increasing
    expect(result.yearlyBreakdown[1].valueAtYearEnd).toBeGreaterThan(result.yearlyBreakdown[0].valueAtYearEnd);
    expect(result.yearlyBreakdown[2].valueAtYearEnd).toBeGreaterThan(result.yearlyBreakdown[1].valueAtYearEnd);
  });

  it('step-up SIP invests more than a flat SIP with the same starting amount', () => {
    const flat = calculateSIPFutureValue({ monthlyAmount: 5000, annualReturnPercent: 12, years: 10 });
    const steppedUp = calculateSIPFutureValue({ monthlyAmount: 5000, annualReturnPercent: 12, years: 10, stepUpPercent: 10 });

    expect(steppedUp.totalInvested).toBeGreaterThan(flat.totalInvested);
    expect(steppedUp.futureValue).toBeGreaterThan(flat.futureValue);
    // First year should be identical since step-up only applies from year 2 onward
    expect(steppedUp.yearlyBreakdown[0].cumulativeInvested).toBeCloseTo(flat.yearlyBreakdown[0].cumulativeInvested, 2);
    expect(steppedUp.yearlyBreakdown[1].monthlyAmount).toBeCloseTo(5500, 2);
  });

  it('returns zeroed result for non-positive inputs', () => {
    expect(calculateSIPFutureValue({ monthlyAmount: 0, annualReturnPercent: 12, years: 5 }).futureValue).toBe(0);
    expect(calculateSIPFutureValue({ monthlyAmount: 5000, annualReturnPercent: 12, years: 0 }).futureValue).toBe(0);
  });
});

describe('calculateLumpsumFutureValue', () => {
  it('matches standard compound interest', () => {
    // 100000 at 10% for 10 years -> 100000 * 1.1^10 ≈ 259374.25
    expect(calculateLumpsumFutureValue(100000, 10, 10)).toBeCloseTo(259374.25, 1);
  });

  it('returns principal unchanged for zero years', () => {
    expect(calculateLumpsumFutureValue(50000, 12, 0)).toBe(50000);
  });
});

describe('calculateRequiredMonthlySIP', () => {
  it('is the inverse of calculateSIPFutureValue for a flat SIP', () => {
    const target = 1000000;
    const annualReturnPercent = 12;
    const years = 15;

    const requiredMonthly = calculateRequiredMonthlySIP(target, annualReturnPercent, years);
    const resultingFV = calculateSIPFutureValue({ monthlyAmount: requiredMonthly, annualReturnPercent, years }).futureValue;

    expect(resultingFV).toBeCloseTo(target, 0);
  });

  it('handles a zero return rate as simple division', () => {
    expect(calculateRequiredMonthlySIP(120000, 0, 10)).toBeCloseTo(1000, 4);
  });
});

describe('compareScenarios', () => {
  it('runs multiple assumption sets and returns one result per scenario', () => {
    const results = compareScenarios([
      { label: 'Conservative', monthlyAmount: 10000, annualReturnPercent: 8, years: 10 },
      { label: 'Moderate', monthlyAmount: 10000, annualReturnPercent: 12, years: 10 },
      { label: 'Aggressive', monthlyAmount: 10000, annualReturnPercent: 15, years: 10 },
    ]);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.label)).toEqual(['Conservative', 'Moderate', 'Aggressive']);
    // Higher assumed return should produce a higher future value for identical contributions
    expect(results[1].futureValue).toBeGreaterThan(results[0].futureValue);
    expect(results[2].futureValue).toBeGreaterThan(results[1].futureValue);
    // Total invested should be identical across scenarios (same amount/years)
    expect(results[0].totalInvested).toBeCloseTo(results[2].totalInvested, 2);
  });
});
