import { describe, it, expect } from 'vitest';
import { calculateXIRR } from './xirr';

describe('Financial Stress Tests', () => {
  it('handles extreme long-term growth (10 years)', () => {
    const flows = [
      { amount: -1000, date: new Date('2010-01-01') },
      { amount: 15000, date: new Date('2020-01-01') },
    ];
    const result = calculateXIRR(flows);
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
  });

  it('handles high-frequency SIPs (Monthly for 5 years)', () => {
    const flows = [];
    const start = new Date('2018-01-01');
    for (let i = 0; i < 60; i++) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + i);
      flows.push({ amount: -5000, date });
    }
    // Final valuation
    flows.push({ amount: 450000, date: new Date('2023-01-01') });

    const result = calculateXIRR(flows);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(isNaN(result!)).toBe(false);
  });

  it('handles erratic cash flows (Buy/Sell/Buy)', () => {
    const flows = [
      { amount: -10000, date: new Date('2020-01-01') }, // Invest
      { amount: 2000, date: new Date('2021-01-01') },   // Partial Sell
      { amount: -5000, date: new Date('2022-01-01') },  // Re-invest
      { amount: 18000, date: new Date('2023-01-01') },  // Current Value
    ];
    const result = calculateXIRR(flows);
    expect(result).toBeDefined();
  });
});
