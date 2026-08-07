import { fetchSchemeDetails } from "./mfapi";

export type FundCategory = 
  | "Large Cap" 
  | "Mid Cap" 
  | "Small Cap" 
  | "Flexi Cap" 
  | "ELSS" 
  | "Debt" 
  | "Hybrid" 
  | "Index Funds" 
  | "International Funds";

export interface BenchmarkScheme {
  schemeCode: string;
  schemeName: string;
  category: FundCategory;
}

// Curated high-performing schemes per category for benchmarking
export const BENCHMARK_SCHEMES: BenchmarkScheme[] = [
  // Large Cap (10 - pure Large Cap, Direct Growth only)
  { schemeCode: "118531", schemeName: "Franklin India Large Cap Fund", category: "Large Cap" },
  { schemeCode: "120586", schemeName: "ICICI Prudential Large Cap Fund", category: "Large Cap" },
  { schemeCode: "150797", schemeName: "WhiteOak Capital Large Cap Fund", category: "Large Cap" },
  { schemeCode: "150440", schemeName: "Quant Large Cap Fund", category: "Large Cap" },
  { schemeCode: "150187", schemeName: "Baroda BNP Paribas Large Cap Fund", category: "Large Cap" },
  { schemeCode: "148353", schemeName: "ITI Large Cap Fund", category: "Large Cap" },
  { schemeCode: "141248", schemeName: "Union Largecap Fund", category: "Large Cap" },
  { schemeCode: "120392", schemeName: "Invesco India Largecap Fund", category: "Large Cap" },
  { schemeCode: "119133", schemeName: "Groww Largecap Fund", category: "Large Cap" },
  { schemeCode: "118269", schemeName: "Canara Robeco Large Cap Fund", category: "Large Cap" },
  // Mid Cap (9 - Direct Growth only, no Large & Mid Cap)
  { schemeCode: "148733", schemeName: "ITI Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "142110", schemeName: "Mahindra Manulife Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "151036", schemeName: "HSBC Midcap Fund", category: "Mid Cap" },
  { schemeCode: "150815", schemeName: "JM Midcap Fund", category: "Mid Cap" },
  { schemeCode: "150584", schemeName: "WhiteOak Capital Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "150817", schemeName: "Canara Robeco Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "150404", schemeName: "Bandhan Midcap Fund", category: "Mid Cap" },
  { schemeCode: "150212", schemeName: "Baroda BNP Paribas Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "118989", schemeName: "HDFC Mid Cap Fund", category: "Mid Cap" },
  { schemeCode: "119716", schemeName: "SBI Midcap Fund", category: "Mid Cap" },
  // Small Cap (10 - all Direct Growth)
  { schemeCode: "120828", schemeName: "Quant Small Cap Fund", category: "Small Cap" },
  { schemeCode: "125497", schemeName: "SBI Small Cap Fund", category: "Small Cap" },
  { schemeCode: "118778", schemeName: "Nippon India Small Cap Fund", category: "Small Cap" },
  { schemeCode: "120164", schemeName: "Kotak Small Cap Fund", category: "Small Cap" },
  { schemeCode: "125354", schemeName: "Axis Small Cap Fund", category: "Small Cap" },
  { schemeCode: "150915", schemeName: "Mahindra Manulife Small Cap Fund", category: "Small Cap" },
  { schemeCode: "151130", schemeName: "HSBC Small Cap Fund", category: "Small Cap" },
  { schemeCode: "147946", schemeName: "Bandhan Small Cap Fund", category: "Small Cap" },
  { schemeCode: "149019", schemeName: "PGIM India Small Cap Fund", category: "Small Cap" },
  { schemeCode: "148618", schemeName: "UTI Small Cap Fund", category: "Small Cap" },
  // Flexi Cap (10 - all Direct Growth)
  { schemeCode: "122639", schemeName: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "120843", schemeName: "Quant Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "118955", schemeName: "HDFC Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "151412", schemeName: "Mirae Asset Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "151379", schemeName: "ITI Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "150387", schemeName: "Baroda BNP Paribas Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "149763", schemeName: "Invesco India Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "150346", schemeName: "WhiteOak Capital Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "149450", schemeName: "Samco Flexi Cap Fund", category: "Flexi Cap" },
  { schemeCode: "144546", schemeName: "Tata Flexi Cap Fund", category: "Flexi Cap" },
  // ELSS (10 - all Direct Growth)
  { schemeCode: "119060", schemeName: "HDFC ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "119723", schemeName: "SBI ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "119773", schemeName: "Kotak ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "120847", schemeName: "Quant ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "120503", schemeName: "Axis ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "151078", schemeName: "HSBC ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "150159", schemeName: "Baroda BNP Paribas ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "149570", schemeName: "Sundaram ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "150838", schemeName: "Samco ELSS Tax Saver Fund", category: "ELSS" },
  { schemeCode: "147541", schemeName: "ITI ELSS Tax Saver Fund", category: "ELSS" },
  // Debt (10 - all Direct Growth)
  { schemeCode: "120435", schemeName: "JM Dynamic Bond Fund", category: "Debt" },
  { schemeCode: "151067", schemeName: "HSBC Short Duration Fund", category: "Debt" },
  { schemeCode: "151087", schemeName: "HSBC Dynamic Bond Fund", category: "Debt" },
  { schemeCode: "150996", schemeName: "HSBC Corporate Bond Fund", category: "Debt" },
  { schemeCode: "151054", schemeName: "HSBC Money Market Fund", category: "Debt" },
  { schemeCode: "151107", schemeName: "HSBC Banking & PSU Debt Fund", category: "Debt" },
  { schemeCode: "151146", schemeName: "HSBC Medium Duration Fund", category: "Debt" },
  { schemeCode: "118569", schemeName: "Franklin India Corporate Debt Fund", category: "Debt" },
  { schemeCode: "143508", schemeName: "Baroda BNP Paribas Ultra Short Duration Fund", category: "Debt" },
  { schemeCode: "144646", schemeName: "DSP Corporate Bond Fund", category: "Debt" },
  // Hybrid (10 - all Direct Growth)
  { schemeCode: "120700", schemeName: "ICICI Prudential Aggressive Hybrid FOF", category: "Hybrid" },
  { schemeCode: "129200", schemeName: "HSBC Aggressive Hybrid FOF", category: "Hybrid" },
  { schemeCode: "132185", schemeName: "Aditya Birla Sun Life Aggressive Hybrid FOF", category: "Hybrid" },
  { schemeCode: "138386", schemeName: "PGIM India Aggressive Hybrid Equity Fund", category: "Hybrid" },
  { schemeCode: "150470", schemeName: "Mirae Asset Balanced Advantage Fund", category: "Hybrid" },
  { schemeCode: "150481", schemeName: "Franklin India Balanced Advantage Fund", category: "Hybrid" },
  { schemeCode: "149717", schemeName: "Sundaram Balanced Advantage Fund", category: "Hybrid" },
  { schemeCode: "151267", schemeName: "WhiteOak Capital Balanced Advantage Fund", category: "Hybrid" },
  { schemeCode: "132183", schemeName: "Aditya Birla Sun Life Conservative Hybrid FOF", category: "Hybrid" },
  { schemeCode: "148958", schemeName: "Parag Parikh Conservative Hybrid Fund", category: "Hybrid" },
  // Index Funds (10 - all Direct Growth / Cumulative)
  { schemeCode: "150390", schemeName: "Quantum Nifty 50 ETF Fund of Fund", category: "Index Funds" },
  { schemeCode: "149803", schemeName: "UTI BSE Sensex Index Fund", category: "Index Funds" },
  { schemeCode: "141841", schemeName: "ICICI Prudential BSE Sensex Index Fund", category: "Index Funds" },
  { schemeCode: "148381", schemeName: "Motilal Oswal S&P 500 Index Fund", category: "Index Funds" },
  { schemeCode: "149219", schemeName: "ICICI Prudential NASDAQ 100 Index Fund", category: "Index Funds" },
  { schemeCode: "120716", schemeName: "UTI Nifty 50 Index Fund", category: "Index Funds" },
  { schemeCode: "150725", schemeName: "Kotak Nifty SDL Plus AAA PSU Bond Index Fund", category: "Index Funds" },
  { schemeCode: "150754", schemeName: "Nippon India Nifty AAA PSU Bond Plus SDL Index Fund", category: "Index Funds" },
  { schemeCode: "148945", schemeName: "SBI Nifty Next 50 Index Fund", category: "Index Funds" },
  { schemeCode: "151157", schemeName: "HSBC Nifty 50 Index Fund", category: "Index Funds" },
  // International Funds (10 - all Direct Growth)
  { schemeCode: "149170", schemeName: "Mirae Asset S&P 500 Top 50 ETF FOF", category: "International Funds" },
  { schemeCode: "140274", schemeName: "Edelweiss US Value Equity Offshore Fund", category: "International Funds" },
  { schemeCode: "148063", schemeName: "Edelweiss US Technology Equity FOF", category: "International Funds" },
  { schemeCode: "119517", schemeName: "Aditya Birla Sun Life International Equity Fund", category: "International Funds" },
  { schemeCode: "148954", schemeName: "Axis Global Innovation Fund of Fund", category: "International Funds" },
  { schemeCode: "145552", schemeName: "Motilal Oswal Nasdaq 100 Fund of Fund", category: "International Funds" },
  { schemeCode: "120186", schemeName: "ICICI Prudential US Bluechip Equity Fund (Direct)", category: "International Funds" },
  { schemeCode: "152140", schemeName: "Aditya Birla Sun Life US Treasury 1-3Y Bond ETFs FOF", category: "International Funds" },
  { schemeCode: "148646", schemeName: "Kotak International REIT Overseas Equity FOF", category: "International Funds" },
  { schemeCode: "149830", schemeName: "Navi US Total Stock Market Passive FOF", category: "International Funds" },
];

export function calculateCAGR(currentNav: number, pastNav: number, days: number) {
  if (!currentNav || !pastNav || days <= 0) return null;
  
  // If period is < 1 year (365 days), return absolute return
  if (days < 365) {
    return ((currentNav / pastNav) - 1) * 100;
  }
  
  // Annualized CAGR for periods >= 1 year
  const years = days / 365;
  return (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;
}

function parseMFDate(dateStr: string): Date {
  const [dd, mm, yyyy] = dateStr.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`);
}

const NAV_LOOKUP_TOLERANCE_MS = 7 * 24 * 60 * 60 * 1000;

const PERIOD_WINDOWS: Record<string, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 3 * 365,
  "5Y": 5 * 365,
  "10Y": 10 * 365,
};

function findNavNearDate(
  navData: { date: string; nav: string }[],
  target: Date
): { nav: number; date: Date; daysAgo: number } | null {
  if (!navData.length) return null;
  let best = navData[0];
  let bestDiff = Math.abs(parseMFDate(navData[0].date).getTime() - target.getTime());
  for (const row of navData) {
    const diff = Math.abs(parseMFDate(row.date).getTime() - target.getTime());
    if (diff < bestDiff) {
      best = row;
      bestDiff = diff;
    }
  }
  if (bestDiff > NAV_LOOKUP_TOLERANCE_MS) return null;
  const date = parseMFDate(best.date);
  const daysAgo = Math.max(1, Math.round((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)));
  return { nav: parseFloat(best.nav), date, daysAgo };
}

/**
 * One mfapi.in fetch → all Top Funds return windows + since-inception.
 * Rejects NAV points that drift >7 days from the target (avoids inventing
 * 10Y returns from a 2-year-old fund's first NAV).
 */
export async function computePeriodReturnsFromMfapi(schemeCode: string): Promise<{
  nav: number;
  returns: Record<string, number | null>;
  sinceInception: number | null;
} | null> {
  const data = await fetchSchemeDetails(schemeCode);
  const navData = data.data as { date: string; nav: string }[] | undefined;
  if (!navData?.length) return null;

  const current = findNavNearDate(navData, new Date());
  if (!current || !Number.isFinite(current.nav)) return null;

  const returns: Record<string, number | null> = {};
  for (const [label, days] of Object.entries(PERIOD_WINDOWS)) {
    const target = new Date();
    target.setDate(target.getDate() - days);
    const past = findNavNearDate(navData, target);
    returns[label] = past ? calculateCAGR(current.nav, past.nav, days) : null;
  }

  const oldest = navData[navData.length - 1]; // mfapi returns newest-first
  const oldestDate = parseMFDate(oldest.date);
  const daysSinceInception = Math.round((Date.now() - oldestDate.getTime()) / (24 * 60 * 60 * 1000));
  const sinceInception =
    daysSinceInception > 30
      ? calculateCAGR(current.nav, parseFloat(oldest.nav), daysSinceInception)
      : null;

  return { nav: current.nav, returns, sinceInception };
}

export async function getHistoricalNav(schemeCode: string, daysAgo: number) {
  const data = await fetchSchemeDetails(schemeCode);
  const navData = data.data;
  
  if (!navData || navData.length === 0) return null;
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  if (daysAgo === 0) {
    const near = findNavNearDate(navData, targetDate);
    return near?.nav ?? parseFloat(navData[0].nav);
  }

  const near = findNavNearDate(navData, targetDate);
  return near?.nav ?? null;
}
