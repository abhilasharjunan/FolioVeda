import { describe, it, expect } from 'vitest';
import { calculateXIRR } from './xirr';

describe('XIRR Calculation Precision', () => {
  it('calculates correct return for a single investment and valuation', () => {
    const flows = [
      { amount: -10000, date: new Date('2023-01-01') },
      { amount: 11000, date: new Date('2024-01-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result).toBeCloseTo(0.10, 2); 
  });

  it('handles multiple SIP-like investments', () => {
    const flows = [
      { amount: -1000, date: new Date('2023-01-01') },
      { amount: -1000, date: new Date('2023-02-01') },
      { amount: -1000, date: new Date('2023-03-01') },
      { amount: 3300, date: new Date('2023-03-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
  });

  it('returns null for insufficient data', () => {
    const flows = [{ amount: -1000, date: new Date() }];
    expect(calculateXIRR(flows)).toBeNull();
  });

  it('returns null for same-day buy + valuation (not 0%)', () => {
    const day = new Date('2024-06-15T10:00:00');
    const flows = [
      { amount: -10000, date: day },
      { amount: 12000, date: new Date(day.getTime() + 60 * 60 * 1000) },
    ];
    expect(calculateXIRR(flows)).toBeNull();
  });

  it('matches a textbook example (₹1L invested, ₹1.3L after 1 year -> ~30%)', () => {
    const flows = [
      { amount: -100000, date: new Date('2023-01-01') },
      { amount: 130000, date: new Date('2024-01-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result).toBeCloseTo(0.30, 2);
  });

  it('does not throw or return NaN for an irregular multi-redemption pattern that can make Newton-Raphson overshoot', () => {
    // Large early redemption followed by reinvestment — a known Newton-Raphson
    // failure mode this fallback (section 3.8) exists to handle.
    const flows = [
      { amount: -50000, date: new Date('2020-01-01') },
      { amount: 45000, date: new Date('2020-06-01') },   // redemption
      { amount: -60000, date: new Date('2020-07-01') },  // reinvestment
      { amount: -20000, date: new Date('2021-01-01') },
      { amount: 90000, date: new Date('2023-01-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result === null || isFinite(result!)).toBe(true);
    if (result !== null) {
      expect(result).toBeGreaterThan(-1); // never below -100%
    }
  });

  it('returns a finite result (not NaN) even when the naive iteration would overshoot below -100%', () => {
    // A near-total loss shortly after investing pushes Newton-Raphson toward
    // rate <= -1, which used to produce NaN via Math.pow(negative, fractional).
    const flows = [
      { amount: -100000, date: new Date('2023-01-01') },
      { amount: 500, date: new Date('2023-02-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result === null || (isFinite(result!) && result! > -1)).toBe(true);
  });
});
