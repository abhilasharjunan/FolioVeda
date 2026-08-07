import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateFundOverlap,
  calculatePortfolioOverlapMatrix,
  calculateLookThroughHoldings,
  normalizeStockKey,
} from './overlap';
import { getFundInsights } from './finapi';

vi.mock('./finapi', () => ({
  getFundInsights: vi.fn(),
}));

const mockedGetFundInsights = vi.mocked(getFundInsights);

function insights(schemeCode: string, schemeName: string, holdings: { stockName: string; allocation: number }[]) {
  return {
    schemeCode,
    schemeName,
    fundHouse: 'Test AMC',
    aum: 'N/A',
    expenseRatio: 'N/A',
    portfolioTurnover: 'N/A',
    fundManager: { name: 'N/A', tenure: 'N/A', experience: 'N/A' },
    holdings: holdings.map((h) => ({ ...h, sector: 'Other' })),
    sectorAllocation: {},
    peers: [],
  };
}

describe('normalizeStockKey', () => {
  it('strips corporate suffixes and punctuation', () => {
    expect(normalizeStockKey('HDFC Bank Ltd.')).toBe(normalizeStockKey('HDFC Bank'));
    expect(normalizeStockKey('Reliance Industries Limited')).toBe(normalizeStockKey('Reliance Industries'));
  });
});

describe('calculateLookThroughHoldings', () => {
  it('weights stock exposure by portfolio allocation × fund weight', () => {
    const map = new Map([
      ['A', insights('A', 'Fund A', [{ stockName: 'HDFC Bank', allocation: 10 }])],
      ['B', insights('B', 'Fund B', [{ stockName: 'HDFC Bank', allocation: 8 }, { stockName: 'Infosys', allocation: 5 }])],
    ]);
    const result = calculateLookThroughHoldings(
      [
        { schemeCode: 'A', schemeName: 'Fund A', portfolioWeight: 60 },
        { schemeCode: 'B', schemeName: 'Fund B', portfolioWeight: 40 },
      ],
      map,
      10
    );
    // HDFC: 60*10/100 + 40*8/100 = 6 + 3.2 = 9.2
    expect(result[0].stockName).toBe('HDFC Bank');
    expect(result[0].effectiveWeight).toBeCloseTo(9.2, 4);
    expect(result[0].heldInFunds).toHaveLength(2);
    // Infosys: 40*5/100 = 2
    expect(result[1].stockName).toBe('Infosys');
    expect(result[1].effectiveWeight).toBeCloseTo(2, 4);
  });
});

describe('calculateFundOverlap (MIN-weight method)', () => {
  beforeEach(() => {
    mockedGetFundInsights.mockReset();
  });

  it('sums min(weightA, weightB) across common stocks', async () => {
    mockedGetFundInsights.mockImplementation(async (code: string) => {
      if (code === 'A') {
        return insights('A', 'Fund A', [
          { stockName: 'HDFC Bank', allocation: 8 },
          { stockName: 'Reliance Industries', allocation: 6 },
          { stockName: 'Infosys', allocation: 5 },
        ]);
      }
      if (code === 'B') {
        return insights('B', 'Fund B', [
          { stockName: 'HDFC Bank', allocation: 5 },   // min(8,5) = 5
          { stockName: 'Reliance Industries', allocation: 9 }, // min(6,9) = 6
          { stockName: 'TCS', allocation: 7 }, // no match
        ]);
      }
      return null;
    });

    const result = await calculateFundOverlap('A', 'B');
    expect(result).not.toBeNull();
    // 5 + 6 = 11
    expect(result!.overlapPercentage).toBeCloseTo(11, 4);
    expect(result!.commonCount).toBe(2);
    expect(result!.dataAvailable).toBe(true);
    expect(result!.commonStocks).toHaveLength(2);
    expect(result!.commonStocks[0].stockName).toBe('Reliance Industries'); // sorted by minWeight desc
    expect(result!.commonStocks[0].minWeight).toBeCloseTo(6, 4);
  });

  it('is case-insensitive and whitespace-tolerant on stock name matching', async () => {
    mockedGetFundInsights.mockImplementation(async (code: string) => {
      if (code === 'A') return insights('A', 'Fund A', [{ stockName: ' HDFC Bank Ltd. ', allocation: 4 }]);
      if (code === 'B') return insights('B', 'Fund B', [{ stockName: 'hdfc bank', allocation: 3 }]);
      return null;
    });

    const result = await calculateFundOverlap('A', 'B');
    expect(result!.overlapPercentage).toBeCloseTo(3, 4);
  });

  it('returns null when there is no holdings data for either fund', async () => {
    mockedGetFundInsights.mockResolvedValue(null);
    const result = await calculateFundOverlap('A', 'B');
    expect(result).toBeNull();
  });

  it('returns null when comparing a fund against itself', async () => {
    const result = await calculateFundOverlap('A', 'A');
    expect(result).toBeNull();
  });

  it('returns 0% overlap when funds share no holdings', async () => {
    mockedGetFundInsights.mockImplementation(async (code: string) => {
      if (code === 'A') return insights('A', 'Fund A', [{ stockName: 'Stock 1', allocation: 5 }]);
      if (code === 'B') return insights('B', 'Fund B', [{ stockName: 'Stock 2', allocation: 5 }]);
      return null;
    });

    const result = await calculateFundOverlap('A', 'B');
    expect(result!.overlapPercentage).toBe(0);
    expect(result!.commonStocks).toHaveLength(0);
  });
});

describe('calculatePortfolioOverlapMatrix', () => {
  beforeEach(() => {
    mockedGetFundInsights.mockReset();
  });

  it('computes every pair exactly once and fetches insights only once per fund', async () => {
    mockedGetFundInsights.mockImplementation(async (code: string) =>
      insights(code, `Fund ${code}`, [{ stockName: 'Shared Stock', allocation: 4 }])
    );

    const pairs = await calculatePortfolioOverlapMatrix(['A', 'B', 'C']);

    // C(3,2) = 3 pairs
    expect(pairs).toHaveLength(3);
    // one fetch per unique scheme code, not per pair
    expect(mockedGetFundInsights).toHaveBeenCalledTimes(3);
  });

  it('returns an empty array for fewer than two funds', async () => {
    const pairs = await calculatePortfolioOverlapMatrix(['A']);
    expect(pairs).toHaveLength(0);
    expect(mockedGetFundInsights).not.toHaveBeenCalled();
  });
});
