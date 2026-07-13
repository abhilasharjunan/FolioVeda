import { describe, it, expect } from 'vitest';
import { parseAmfiNavAll, mapAmfiCategoryToFundCategory } from './amfi';

// A trimmed but structurally faithful sample of AMFI's NAVAll.txt format:
// header row, blank-line-separated sections, category headers, AMC name
// headers, and semicolon-delimited data rows (some with "-" for a missing
// reinvestment ISIN, which is common for growth-only plans).
const SAMPLE = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date

Open Ended Schemes(Large Cap Fund)

Franklin Templeton Mutual Fund

118531;INF090I01239;-;Franklin India Large Cap Fund - Direct Plan-Growth;187.4500;09-Jul-2026
118530;INF090I01221;INF090I01AB1;Franklin India Large Cap Fund-Growth;150.1200;09-Jul-2026

Open Ended Schemes(ELSS)

HDFC Mutual Fund

119060;INF179K01BE0;-;HDFC ELSS Tax saver - Direct Plan - Growth Option;900.1234;09-Jul-2026

Open Ended Schemes(Overnight Fund)

Aditya Birla Sun Life Mutual Fund

103360;INF209K01UP7;INF209K01UQ5;Aditya Birla Sun Life Overnight Fund - Direct Plan-Growth;1279.5678;09-Jul-2026
`;

describe('parseAmfiNavAll', () => {
  it('parses data rows and skips the header row and blank lines', () => {
    const records = parseAmfiNavAll(SAMPLE);
    expect(records).toHaveLength(4);
    expect(records.map((r) => r.schemeCode)).toEqual(['118531', '118530', '119060', '103360']);
  });

  it('attaches the correct AMC name and raw AMFI category per section', () => {
    const records = parseAmfiNavAll(SAMPLE);
    const franklin = records.find((r) => r.schemeCode === '118531')!;
    expect(franklin.amcName).toBe('Franklin Templeton Mutual Fund');
    expect(franklin.amfiCategory).toBe('Open Ended Schemes(Large Cap Fund)');

    const hdfc = records.find((r) => r.schemeCode === '119060')!;
    expect(hdfc.amcName).toBe('HDFC Mutual Fund');
    expect(hdfc.amfiCategory).toBe('Open Ended Schemes(ELSS)');
  });

  it('parses NAV as a number and normalizes "-" ISINs to null', () => {
    const records = parseAmfiNavAll(SAMPLE);
    const franklin = records.find((r) => r.schemeCode === '118531')!;
    expect(franklin.nav).toBeCloseTo(187.45, 4);
    expect(franklin.isinReinvestment).toBeNull();
    expect(franklin.isinGrowth).toBe('INF090I01239');

    const growthAndReinvestment = records.find((r) => r.schemeCode === '118530')!;
    expect(growthAndReinvestment.isinReinvestment).toBe('INF090I01AB1');
  });

  it('maps recognized categories to the app taxonomy', () => {
    const records = parseAmfiNavAll(SAMPLE);
    expect(records.find((r) => r.schemeCode === '118531')!.category).toBe('Large Cap');
    expect(records.find((r) => r.schemeCode === '119060')!.category).toBe('ELSS');
    expect(records.find((r) => r.schemeCode === '103360')!.category).toBe('Debt');
  });

  it('ignores malformed or short lines without throwing', () => {
    const messy = SAMPLE + '\nThis is not a valid data row;too;few\n;;;;;\n';
    expect(() => parseAmfiNavAll(messy)).not.toThrow();
    expect(parseAmfiNavAll(messy)).toHaveLength(4);
  });

  it('returns an empty array for empty input', () => {
    expect(parseAmfiNavAll('')).toEqual([]);
  });
});

describe('mapAmfiCategoryToFundCategory', () => {
  it('maps common equity categories correctly', () => {
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Large Cap Fund)')).toBe('Large Cap');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Mid Cap Fund)')).toBe('Mid Cap');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Small Cap Fund)')).toBe('Small Cap');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Flexi Cap Fund)')).toBe('Flexi Cap');
  });

  it('maps debt sub-categories to Debt', () => {
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Liquid Fund)')).toBe('Debt');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Corporate Bond Fund)')).toBe('Debt');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Gilt Fund)')).toBe('Debt');
  });

  it('maps hybrid sub-categories to Hybrid', () => {
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Aggressive Hybrid Fund)')).toBe('Hybrid');
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Arbitrage Fund)')).toBe('Hybrid');
  });

  it('returns null for categories outside the app taxonomy', () => {
    expect(mapAmfiCategoryToFundCategory('Open Ended Schemes(Sectoral/Thematic)')).toBeNull();
    expect(mapAmfiCategoryToFundCategory('Close Ended Schemes(Fixed Term Plan)')).toBeNull();
  });
});
