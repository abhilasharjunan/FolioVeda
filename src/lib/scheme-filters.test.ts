import { describe, it, expect } from 'vitest';
import { isDirectGrowthScheme } from './scheme-filters';

describe('isDirectGrowthScheme', () => {
  it('accepts Direct Growth plan names', () => {
    expect(isDirectGrowthScheme('HDFC Mid Cap Opportunities Fund - Direct Plan - Growth Option')).toBe(true);
    expect(isDirectGrowthScheme('Parag Parikh Flexi Cap Fund (Direct) - Growth')).toBe(true);
    expect(isDirectGrowthScheme('NIPPON INDIA SMALL CAP FUND - DIRECT PLAN - GROWTH PLAN')).toBe(true);
  });

  it('rejects Regular and IDCW / dividend plans', () => {
    expect(isDirectGrowthScheme('HDFC Mid Cap Opportunities Fund - Regular Plan - Growth')).toBe(false);
    expect(isDirectGrowthScheme('SBI Bluechip Fund - Direct Plan - IDCW')).toBe(false);
    expect(isDirectGrowthScheme('Axis Small Cap Fund - Direct - Dividend Payout')).toBe(false);
    expect(isDirectGrowthScheme('ICICI Prudential Bluechip Fund - Direct Plan - Dividend Reinvestment')).toBe(false);
  });

  it('rejects names missing Direct or Growth', () => {
    expect(isDirectGrowthScheme('Franklin India Large Cap Fund')).toBe(false);
    expect(isDirectGrowthScheme('Some Fund Direct Plan')).toBe(false);
    expect(isDirectGrowthScheme('Some Fund Growth Option')).toBe(false);
  });

  it('rejects empty and whitespace-only names', () => {
    expect(isDirectGrowthScheme('')).toBe(false);
    expect(isDirectGrowthScheme('   ')).toBe(false);
  });
});
