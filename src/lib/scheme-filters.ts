/**
 * Scheme name filters for ranking / display. AMFI and mfapi names vary in
 * punctuation ("- Direct Plan - Growth Option", "(Direct) Growth", etc.) so
 * matching is intentionally substring-based and case-insensitive.
 */

export function isDirectGrowthScheme(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("regular")) return false;
  if (/\bidcw\b|dividend|payout|reinvestment/.test(n)) return false;
  // Index funds often use "Cumulative" instead of "Growth" for the accumulation option.
  const isGrowthLike = n.includes("growth") || n.includes("cumulative");
  return n.includes("direct") && isGrowthLike;
}

/**
 * Collapse noisy SchemeMaster / AMFI category strings into a short bucket
 * for allocation charts (e.g. "Equity Scheme - Flexi Cap Fund" → "Flexi Cap").
 */
export function normalizeSchemeCategory(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Other";
  const n = raw.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();

  if (/\belss\b|tax.?saver|equity linked/.test(n)) return "ELSS";
  if (/small.?cap/.test(n)) return "Small Cap";
  if (/mid.?cap/.test(n)) return "Mid Cap";
  if (/large.?cap|blue.?chip/.test(n)) return "Large Cap";
  if (/multi.?cap/.test(n)) return "Multi Cap";
  if (/flexi.?cap/.test(n)) return "Flexi Cap";
  if (/index|etf|nifty|sensex/.test(n)) return "Index";
  if (/international|global|overseas|foreign/.test(n)) return "International";
  if (/hybrid|balanced|aggressive hybrid|conservative hybrid/.test(n)) return "Hybrid";
  if (/debt|liquid|gilt|bond|income|money market|overnight|arbitrage/.test(n)) return "Debt";
  if (/sector|thematic|pharma|banking|infrastructure|technology/.test(n)) return "Sectoral / Thematic";
  if (/equity/.test(n)) return "Equity (Other)";

  // Already a short label like "Flexi Cap" / "Debt"
  if (raw.length <= 24 && !/scheme|fund|equity schemes?/i.test(raw)) {
    return raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return "Other";
}
