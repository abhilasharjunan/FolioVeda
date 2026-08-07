/**
 * XIRR Calculation Engine
 * Uses Newton-Raphson method to find the internal rate of return for irregular cash flows.
 * 
 * Formula: Σ [ CF_i / (1 + rate)^((d_i - d_0)/365) ] = 0
 */

export function calculateXIRR(cashFlows: { amount: number; date: Date }[]) {
  if (cashFlows.length < 2) return null;

  const d0 = cashFlows[0].date.getTime();
  const lastDay = cashFlows[cashFlows.length - 1].date.getTime();
  const totalDays = (lastDay - d0) / (1000 * 60 * 60 * 24);

  // XIRR is undefined for same-day cash flows — return null (not 0),
  // so the UI can show "Insufficient data" instead of a fake 0.00%.
  if (totalDays < 1) return null;

  const x0 = 0.1;
  const precision = 1e-6;
  const maxIterations = 100;

  const getNetPresentValue = (rate: number) => {
    let npv = 0;
    for (const cf of cashFlows) {
      const days = (cf.date.getTime() - d0) / (1000 * 60 * 60 * 24);
      npv += cf.amount / Math.pow(1 + rate, days / 365);
    }
    return npv;
  };

  const getDerivative = (rate: number) => {
    let derivative = 0;
    for (const cf of cashFlows) {
      const days = (cf.date.getTime() - d0) / (1000 * 60 * 60 * 24);
      derivative -= (days / 365) * cf.amount / Math.pow(1 + rate, (days / 365) + 1);
    }
    return derivative;
  };

  let rate = x0;
  let converged = false;
  for (let i = 0; i < maxIterations; i++) {
    const npv = getNetPresentValue(rate);
    const derivative = getDerivative(rate);

    if (Math.abs(npv) < precision) { converged = true; break; }
    if (derivative === 0) break;

    const newRate = rate - npv / derivative;
    // Guard against divergence (Infinity/NaN) or overshooting below -100%,
    // where (1 + rate) raised to a fractional power produces NaN.
    if (!isFinite(newRate) || newRate <= -1) break;
    rate = newRate;
    if (Math.abs(getNetPresentValue(rate)) < precision) { converged = true; break; }
  }

  if (converged && isFinite(rate) && rate > -1) return rate;

  // Newton-Raphson didn't converge cleanly (known failure mode for irregular
  // cash-flow patterns, e.g. a large redemption followed by reinvestment) —
  // fall back to bisection over a wide, sane range instead of silently
  // returning 0, which would be indistinguishable from a genuine 0% return.
  // See FolioVeda_Audit_and_Roadmap.md, section 1.8/3.8.
  let lo = -0.99;
  let hi = 10; // 1000% annualized — generous upper bound for pathological inputs
  const npvLo = getNetPresentValue(lo);
  const npvHi = getNetPresentValue(hi);
  if (!isFinite(npvLo) || !isFinite(npvHi) || Math.sign(npvLo) === Math.sign(npvHi)) {
    // No sign change across the bracket — bisection can't find a root either.
    return null;
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = getNetPresentValue(mid);
    if (Math.abs(npvMid) < precision) return mid;
    if (Math.sign(npvMid) === Math.sign(npvLo)) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
