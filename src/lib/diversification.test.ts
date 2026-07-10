import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// getPortfolioDiversification talks to Prisma + NextAuth directly, so mock both
// at the module boundary and drive it through realistic holding/scheme shapes.
// This is the regression test for the bug in FolioVeda_Audit_and_Roadmap.md
// section 1.2/3.2: allocation must be weighted by market value (units * NAV),
// not raw unit count.

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({ user: { id: 'user-1', email: 'test@example.com' } })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    holding: { findMany: vi.fn() },
    schemeMaster: { findMany: vi.fn() },
  },
}));

import { getPortfolioDiversification } from './diversification';
import { prisma } from '@/lib/prisma';

const mockedHoldingFindMany = vi.mocked(prisma.holding.findMany);
const mockedSchemeFindMany = vi.mocked(prisma.schemeMaster.findMany);

describe('getPortfolioDiversification', () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test'; // skip the build-time mock branch
    mockedHoldingFindMany.mockReset();
    mockedSchemeFindMany.mockReset();
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDbUrl;
  });

  it('weights category allocation by market value (units * NAV), not raw units', async () => {
    // Debt fund: 1000 units @ NAV 15 = Rs 15,000
    // Equity fund: 100 units @ NAV 450 = Rs 45,000
    // Unit-weighted (the bug) would show Debt ~91%. Value-weighted (correct):
    // Equity 45,000 / 60,000 = 75%, Debt 15,000 / 60,000 = 25%.
    mockedHoldingFindMany.mockResolvedValue([
      { schemeCode: 'DEBT1', units: 1000 },
      { schemeCode: 'EQ1', units: 100 },
    ] as any);
    mockedSchemeFindMany.mockResolvedValue([
      { schemeCode: 'DEBT1', category: 'Debt', latestNav: 15 },
      { schemeCode: 'EQ1', category: 'Large Cap', latestNav: 450 },
    ] as any);

    const result = await getPortfolioDiversification();

    expect(result).not.toBeNull();
    const debt = result!.distribution.find((d) => d.name === 'Debt');
    const equity = result!.distribution.find((d) => d.name === 'Large Cap');

    expect(debt!.percentage).toBeCloseTo(25, 4);
    expect(equity!.percentage).toBeCloseTo(75, 4);
  });

  it('returns null when the portfolio has no holdings', async () => {
    mockedHoldingFindMany.mockResolvedValue([]);
    mockedSchemeFindMany.mockResolvedValue([]);

    const result = await getPortfolioDiversification();
    expect(result).toBeNull();
  });

  it('scores a single-category portfolio as highly concentrated (HHI = 1)', async () => {
    mockedHoldingFindMany.mockResolvedValue([
      { schemeCode: 'EQ1', units: 100 },
    ] as any);
    mockedSchemeFindMany.mockResolvedValue([
      { schemeCode: 'EQ1', category: 'Large Cap', latestNav: 100 },
    ] as any);

    const result = await getPortfolioDiversification();
    expect(result!.score).toBe(0); // HHI = 1 -> score = (1 - 1) * 100 = 0
    expect(result!.riskLevel).toBe('High Concentration');
  });

  it('scores an evenly split multi-category portfolio as well diversified', async () => {
    mockedHoldingFindMany.mockResolvedValue([
      { schemeCode: 'A', units: 100 },
      { schemeCode: 'B', units: 100 },
      { schemeCode: 'C', units: 100 },
      { schemeCode: 'D', units: 100 },
      { schemeCode: 'E', units: 100 },
    ] as any);
    const schemeRows = ['A', 'B', 'C', 'D', 'E'].map((code, i) => ({
      schemeCode: code,
      category: `Category ${i}`,
      latestNav: 100, // equal value in each of 5 categories -> HHI = 5 * 0.2^2 = 0.2
    }));
    mockedSchemeFindMany.mockResolvedValue(schemeRows as any);

    const result = await getPortfolioDiversification();
    expect(result!.score).toBe(80); // (1 - 0.2) * 100 = 80
    expect(result!.riskLevel).toBe('Well Diversified');
  });
});
