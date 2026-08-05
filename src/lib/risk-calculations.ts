import { RISK_FREE_RATE } from "./config";

export interface ReturnStats {
  volatility: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  sharpeRatio: number;
  sortinoRatio: number;
  alpha: number;
  beta: number;
  rSquared: number;
  treynorRatio: number;
  compositeScore: number;
}

const MONTHS_IN_YEAR = 12;
const MONTHLY_RFR = RISK_FREE_RATE / MONTHS_IN_YEAR;

export function computeMonthlyReturns(navs: number[]): number[] {
  const returns: number[] = [];
  for (let i = 0; i < navs.length - 1; i++) {
    returns.push((navs[i] - navs[i + 1]) / navs[i + 1]);
  }
  return returns;
}

export function computeAnnualizedVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / monthlyReturns.length;
  return Math.sqrt(variance) * Math.sqrt(MONTHS_IN_YEAR);
}

export function computeDownsideDeviation(monthlyReturns: number[]): number {
  const downsideReturns = monthlyReturns.filter(r => r < MONTHLY_RFR);
  if (downsideReturns.length === 0) return 0;
  const variance = downsideReturns.reduce((a, b) => a + Math.pow(b - MONTHLY_RFR, 2), 0) / downsideReturns.length;
  return Math.sqrt(variance) * Math.sqrt(MONTHS_IN_YEAR);
}

export function computeSortinoRatio(monthlyReturns: number[]): number {
  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const annualizedReturn = avgReturn * MONTHS_IN_YEAR;
  const downsideDev = computeDownsideDeviation(monthlyReturns);
  if (downsideDev === 0) return 0;
  return (annualizedReturn - RISK_FREE_RATE) / downsideDev;
}

/**
 * Max drawdown for a NAV series ordered newest-to-oldest (same convention as
 * computeMonthlyReturns / fetchMonthlyNavSeries). Peak-to-trough must be walked
 * chronologically (oldest → newest); iterating newest-first misreads older
 * troughs as drawdowns from a future peak.
 */
export function computeMaxDrawdown(navsNewestFirst: number[]): { drawdown: number; duration: number } {
  if (navsNewestFirst.length < 2) return { drawdown: 0, duration: 0 };
  const navs = [...navsNewestFirst].reverse();
  let peak = -Infinity;
  let peakIndex = 0;
  let maxDD = 0;
  let maxDDStart = 0;
  let maxDDEnd = 0;

  for (let i = 0; i < navs.length; i++) {
    if (navs[i] >= peak) {
      peak = navs[i];
      peakIndex = i;
    }
    const dd = (peak - navs[i]) / peak;
    if (dd > maxDD) {
      maxDD = dd;
      maxDDStart = peakIndex;
      maxDDEnd = i;
    }
  }

  return { drawdown: maxDD, duration: maxDDEnd - maxDDStart };
}

export function computeSharpeRatio(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const annualizedReturn = mean * MONTHS_IN_YEAR;
  const vol = computeAnnualizedVolatility(monthlyReturns);
  if (vol === 0) return 0;
  return (annualizedReturn - RISK_FREE_RATE) / vol;
}

export function computeBetaAlphaRSquared(
  schemeReturns: number[],
  benchmarkReturns: number[]
): { beta: number; alpha: number; rSquared: number } {
  if (schemeReturns.length < 2 || benchmarkReturns.length < 2) {
    return { beta: 1, alpha: 0, rSquared: 0 };
  }

  const len = Math.min(schemeReturns.length, benchmarkReturns.length);
  const sr = schemeReturns.slice(0, len);
  const br = benchmarkReturns.slice(0, len);

  const schemeMean = sr.reduce((a, b) => a + b, 0) / len;
  const benchmarkMean = br.reduce((a, b) => a + b, 0) / len;

  const covariance = sr.reduce((acc, ret, i) => acc + (ret - schemeMean) * (br[i] - benchmarkMean), 0) / len;
  const benchmarkVariance = br.reduce((a, b) => a + Math.pow(b - benchmarkMean, 2), 0) / len;
  const beta = benchmarkVariance !== 0 ? covariance / benchmarkVariance : 1;

  const annualizedSchemeReturn = schemeMean * MONTHS_IN_YEAR;
  const annualizedBenchmarkReturn = benchmarkMean * MONTHS_IN_YEAR;
  const alpha = annualizedSchemeReturn - (RISK_FREE_RATE + beta * (annualizedBenchmarkReturn - RISK_FREE_RATE));

  const totalSumSquares = sr.reduce((acc, ret) => acc + Math.pow(ret - schemeMean, 2), 0);
  const residualSumSquares = sr.reduce((acc, ret, i) => {
    const predicted = schemeMean + beta * (br[i] - benchmarkMean);
    return acc + Math.pow(ret - predicted, 2);
  }, 0);
  const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

  return { beta, alpha, rSquared };
}

export function computeTreynorRatio(monthlyReturns: number[], beta: number): number {
  if (beta === 0) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const annualizedReturn = mean * MONTHS_IN_YEAR;
  return (annualizedReturn - RISK_FREE_RATE) / beta;
}

export function computeHHI(holdings: { allocation: number }[]): number {
  return holdings.reduce((sum, h) => sum + Math.pow(h.allocation, 2), 0);
}

export function computeSectorConcentration(sectorAllocation: Record<string, number>): number {
  return Object.values(sectorAllocation)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, val) => sum + val, 0);
}

/**
 * 0–100 risk score where higher = riskier (matches Risk Analysis UI colors and
 * PortfolioHealthGauge, which treats riskScore as exposure to invert).
 * Volatility/drawdown push the score up; stronger Sharpe/Sortino/alpha push it down.
 */
export function computeCompositeScore(params: {
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  alpha: number;
  beta: number;
  rSquared: number;
}): number {
  const normVol = Math.max(0, Math.min(params.volatility * 200, 100));
  const normDD = Math.max(0, Math.min(params.maxDrawdown * 200, 100));
  const normSharpe = Math.max(0, Math.min(params.sharpeRatio * 25, 100));
  const normSortino = Math.max(0, Math.min(params.sortinoRatio * 25, 100));
  const normAlpha = Math.max(0, Math.min((params.alpha + 0.1) * 250, 100));
  // |β − 1| as market-deviation risk (β≈1 → low contribution)
  const normBetaDev = Math.max(0, Math.min(Math.abs(params.beta - 1) * 100, 100));
  const normRSquared = Math.max(0, Math.min(params.rSquared * 100, 100));

  const score =
    normVol * 0.25 +
    normDD * 0.2 +
    (100 - normSharpe) * 0.2 +
    (100 - normSortino) * 0.15 +
    (100 - normAlpha) * 0.1 +
    normBetaDev * 0.05 +
    normRSquared * 0.05;

  return Math.max(0, Math.min(score, 100));
}
