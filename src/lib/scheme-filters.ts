/**
 * Scheme name filters for ranking / display. AMFI and mfapi names vary in
 * punctuation ("- Direct Plan - Growth Option", "(Direct) Growth", etc.) so
 * matching is intentionally substring-based and case-insensitive.
 */

export function isDirectGrowthScheme(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("regular")) return false;
  if (/\bidcw\b|dividend|payout|reinvestment/.test(n)) return false;
  return n.includes("direct") && n.includes("growth");
}
