import { FundCategory } from "./funds";

/**
 * AMFI publishes a single bulk text file with the latest NAV for every mutual
 * fund scheme in India, updated daily on business days. Fetching this ONE file
 * gives us the full ~9,000+ scheme universe in one HTTP call, instead of the
 * per-scheme mfapi.in calls used elsewhere (fetchSchemeDetails/getHistoricalNav)
 * which only cover the ~90-scheme curated BENCHMARK_SCHEMES list.
 *
 * This is what powers: (1) full-universe autocomplete/search via SchemeCatalog,
 * and (2) a much cheaper daily latestNav refresh for SchemeMaster — one bulk
 * fetch + DB writes, instead of one external API call per held scheme.
 *
 * It does NOT give historical NAV/returns — AMFI's bulk file is a daily
 * snapshot, not a time series. Computing CAGR for the full universe (not just
 * the curated list) would require accumulating our own daily snapshots over
 * time, or falling back to mfapi.in per-scheme for that specific need.
 */

const AMFI_NAV_ALL_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
const FETCH_TIMEOUT_MS = 20000;

export interface AmfiSchemeRecord {
  schemeCode: string;
  isinGrowth: string | null;
  isinReinvestment: string | null;
  schemeName: string;
  nav: number;
  date: string; // as published, e.g. "09-Jul-2026"
  amcName: string;
  amfiCategory: string; // raw AMFI category header, e.g. "Open Ended Schemes(Large Cap Fund)"
  category: FundCategory | null; // best-effort mapping to the app's taxonomy
}

const CATEGORY_HEADER_RE = /^(Open|Close|Interval)\s+Ended\s+Schemes?\s*\(/i;

/**
 * Best-effort mapping from AMFI's granular scheme categories (dozens of them)
 * down to the app's 9-category taxonomy. Ordered by specificity — first match
 * wins. Anything not matched (sectoral/thematic, solution-oriented, FoF
 * domestic, close-ended, etc.) returns null rather than a guess.
 */
export function mapAmfiCategoryToFundCategory(amfiCategory: string): FundCategory | null {
  const c = amfiCategory.toLowerCase();

  if (c.includes("elss")) return "ELSS";
  if (c.includes("large cap")) return "Large Cap";
  if (c.includes("mid cap") && !c.includes("large") && !c.includes("small")) return "Mid Cap";
  if (c.includes("small cap")) return "Small Cap";
  if (c.includes("flexi cap") || c.includes("multi cap")) return "Flexi Cap";
  if (c.includes("index fund") || c.includes("etf")) return "Index Funds";
  if (c.includes("fund of fund") && (c.includes("overseas") || c.includes("global") || c.includes("international") || c.includes("us ") || c.includes("nasdaq"))) {
    return "International Funds";
  }
  if (c.includes("overseas") || c.includes("international") || c.includes("global")) return "International Funds";
  if (
    c.includes("hybrid") ||
    c.includes("arbitrage") ||
    c.includes("balanced") ||
    c.includes("asset allocation") ||
    c.includes("equity savings")
  ) {
    return "Hybrid";
  }
  if (
    c.includes("debt scheme") ||
    c.includes("overnight fund") ||
    c.includes("liquid fund") ||
    c.includes("duration fund") ||
    c.includes("money market") ||
    c.includes("dynamic bond") ||
    c.includes("corporate bond") ||
    c.includes("credit risk") ||
    c.includes("banking and psu") ||
    c.includes("gilt fund") ||
    c.includes("floater fund")
  ) {
    return "Debt";
  }
  return null;
}

function parseAmfiLine(line: string): { schemeCode: string; isinGrowth: string | null; isinReinvestment: string | null; schemeName: string; nav: number; date: string } | null {
  const parts = line.split(";");
  if (parts.length < 6) return null;

  const [schemeCodeRaw, isinGrowthRaw, isinReinvestmentRaw, schemeNameRaw, navRaw, dateRaw] = parts;
  const schemeCode = schemeCodeRaw.trim();
  if (!schemeCode || !/^\d+$/.test(schemeCode)) return null;

  const nav = parseFloat(navRaw.trim());
  if (!isFinite(nav)) return null;

  const clean = (v: string) => {
    const t = v.trim();
    return t === "" || t === "-" ? null : t;
  };

  return {
    schemeCode,
    isinGrowth: clean(isinGrowthRaw),
    isinReinvestment: clean(isinReinvestmentRaw),
    schemeName: schemeNameRaw.trim(),
    nav,
    date: dateRaw.trim(),
  };
}

/** Parses the raw NAVAll.txt content into structured, categorized records. */
export function parseAmfiNavAll(raw: string): AmfiSchemeRecord[] {
  const records: AmfiSchemeRecord[] = [];
  let currentAmfiCategory = "";
  let currentAmcName = "";

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("Scheme Code")) continue; // column header row

    const parsed = parseAmfiLine(line);
    if (parsed) {
      records.push({
        ...parsed,
        amcName: currentAmcName,
        amfiCategory: currentAmfiCategory,
        category: mapAmfiCategoryToFundCategory(currentAmfiCategory),
      });
      continue;
    }

    if (CATEGORY_HEADER_RE.test(line)) {
      currentAmfiCategory = line;
    } else {
      // Any other non-empty, non-data line between category sections is an
      // AMC/mutual fund house name header.
      currentAmcName = line;
    }
  }

  return records;
}

/** Fetches and parses the AMFI bulk NAV file. Throws on network/timeout failure. */
export async function fetchAmfiNavAll(): Promise<AmfiSchemeRecord[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(AMFI_NAV_ALL_URL, {
      signal: controller.signal,
      headers: {
        // AMFI's endpoint is known to be picky about requests with no UA.
        "User-Agent": "Mozilla/5.0 (compatible; FolioVeda/1.0; +https://foliveda.example)",
      },
    });
    if (!response.ok) throw new Error(`AMFI NAVAll.txt returned ${response.status}`);
    const text = await response.text();
    if (!text || text.length < 1000) throw new Error("AMFI NAVAll.txt response looked truncated or empty");
    return parseAmfiNavAll(text);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AMFI NAVAll.txt request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
