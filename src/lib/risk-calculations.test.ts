import { describe, it, expect } from 'vitest';
import { 
  computeMonthlyReturns, 
  computeAnnualizedVolatility, 
  computeDownsideDeviation, 
  computeSortinoRatio, 
  computeMaxDrawdown, 
  computeSharpeRatio, 
  computeBetaAlphaRSquared, 
  computeTreynorRatio, 
  computeHHI, 
  computeSectorConcentration, 
  computeCompositeScore 
} from './risk-calculations';

describe('Risk Calculations', () => {
  const mockNavs = [100, 102, 101, 105, 104, 108];
  const mockReturns = [0.02, -0.01, 0.04, -0.01, 0.04]; // roughly correspond to mockNavs
  const mockBenchmarkReturns = [0.01, -0.005, 0.03, -0.005, 0.03];

  it('computeMonthlyReturns should calculate correct percentage changes', () => {
    const navs = [100, 110, 99];
    const result = computeMonthlyReturns(navs);
    // (100-110)/110 = -0.0909, (110-99)/99 = 0.1111
    expect(result[0]).toBeCloseTo(-0.0909, 4);
    expect(result[1]).toBeCloseTo(0.1111, 4);
  });

  it('computeAnnualizedVolatility should calculate volatility correctly', () => {
    const returns = [0.01, -0.01, 0.01, -0.01];
    const vol = computeAnnualizedVolatility(returns);
    expect(vol).toBeGreaterThan(0);
    expect(typeof vol).toBe('number');
  });

  it('computeDownsideDeviation should only consider returns below RFR', () => {
    const returns = [0.05, -0.02, 0.06, -0.01]; // RFR is 0.065/12 ≈ 0.0054
    const dev = computeDownsideDeviation(returns);
    expect(dev).toBeGreaterThan(0);
  });

  it('computeSortinoRatio should handle zero downside deviation', () => {
    const returns = [0.1, 0.2, 0.3]; // All above RFR
    expect(computeSortinoRatio(returns)).toBe(0);
  });

  it('computeMaxDrawdown should find the largest peak-to-trough drop (newest-first NAV series)', () => {
    // Chronological oldest→newest: 100 → 120 → 90 → 110 → 80 → 130
    // Peak 120 → trough 80 = (120-80)/120 = 0.3333
    // Input must be newest-first to match computeMonthlyReturns / production.
    const navsNewestFirst = [130, 80, 110, 90, 120, 100];
    const result = computeMaxDrawdown(navsNewestFirst);
    expect(result.drawdown).toBeCloseTo(0.3333, 4);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('computeMaxDrawdown should not invent drawdowns when reading newest-first history backwards', () => {
    // Chronological: 70 → 90 → 80 → 95 → 100 (steady recovery after a small dip)
    // Real MDD is 90→80 = 11.11%. Newest-first walk without reverse would wrongly
    // treat older lows as drawdowns from the current peak.
    const navsNewestFirst = [100, 95, 80, 90, 70];
    const result = computeMaxDrawdown(navsNewestFirst);
    expect(result.drawdown).toBeCloseTo(0.1111, 3);
  });

  it('computeSharpeRatio should return 0 if volatility is 0', () => {
    const returns = [0.01, 0.01, 0.01];
    expect(computeSharpeRatio(returns)).toBe(0);
  });

  it('computeBetaAlphaRSquared should calculate valid values', () => {
    const result = computeBetaAlphaRSquared(mockReturns, mockBenchmarkReturns);
    expect(result).toHaveProperty('beta');
    expect(result).toHaveProperty('alpha');
    expect(result).toHaveProperty('rSquared');
    expect(result.beta).toBeGreaterThan(0);
  });

  it('computeTreynorRatio should return 0 if beta is 0', () => {
    expect(computeTreynorRatio([0.01, 0.02], 0)).toBe(0);
  });

  it('computeHHI should calculate concentration', () => {
    const holdings = [{ allocation: 0.5 }, { allocation: 0.3 }, { allocation: 0.2 }];
    const hhi = computeHHI(holdings);
    // 0.5^2 + 0.3^2 + 0.2^2 = 0.25 + 0.09 + 0.04 = 0.38
    expect(hhi).toBeCloseTo(0.38, 4);
  });

  it('computeSectorConcentration should sum top 3 sectors', () => {
    const sectors = { 'IT': 40, 'Finance': 30, 'Pharma': 20, 'Energy': 10 };
    const conc = computeSectorConcentration(sectors);
    // 40 + 30 + 20 = 90
    expect(conc).toBe(90);
  });

  it('computeCompositeScore should return value between 0 and 100', () => {
    const params = {
      volatility: 0.15,
      maxDrawdown: 0.2,
      sharpeRatio: 1.2,
      sortinoRatio: 1.5,
      alpha: 0.02,
      beta: 1.1,
      rSquared: 0.85
    };
    const score = computeCompositeScore(params);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('computeCompositeScore should treat higher Sharpe as lower risk (higher = riskier scale)', () => {
    const base = {
      volatility: 0.15,
      maxDrawdown: 0.2,
      sharpeRatio: 0.2,
      sortinoRatio: 0.2,
      alpha: 0,
      beta: 1,
      rSquared: 0.5,
    };
    const lowSharpe = computeCompositeScore(base);
    const highSharpe = computeCompositeScore({ ...base, sharpeRatio: 2.0, sortinoRatio: 2.0 });
    expect(highSharpe).toBeLessThan(lowSharpe);
  });
});
