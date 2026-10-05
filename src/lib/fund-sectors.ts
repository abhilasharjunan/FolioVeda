type HoldingLike = { stockName: string; sector: string; allocation: number };

const MAX_SECTOR_SLICES = 8;
export const TOP_HOLDINGS_DISPLAY = 10;

function cleanSectorLabel(raw: string): string {
  const t = raw.trim();
  if (!t || t === "Other" || t === "N/A") return "Other";
  return t;
}

export function aggregateSectorsFromHoldings(holdings: HoldingLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of holdings) {
    const sector = cleanSectorLabel(h.sector || "Other");
    if (!Number.isFinite(h.allocation) || h.allocation <= 0) continue;
    out[sector] = (out[sector] || 0) + h.allocation;
  }
  return out;
}

function rollUpSmallSectors(sectors: Record<string, number>): Record<string, number> {
  const entries = Object.entries(sectors)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length <= MAX_SECTOR_SLICES) {
    return Object.fromEntries(entries);
  }

  const top = entries.slice(0, MAX_SECTOR_SLICES);
  const otherWeight = entries.slice(MAX_SECTOR_SLICES).reduce((s, [, v]) => s + v, 0);
  const result = Object.fromEntries(top);
  if (otherWeight >= 0.05) {
    result.Other = (result.Other || 0) + otherWeight;
  }
  return result;
}

/** Detect legacy SectorCache blobs that stored stock names instead of sectors. */
function sectorsLookLikeStockNames(
  sectors: Record<string, number>,
  holdings: HoldingLike[]
): boolean {
  const keys = Object.keys(sectors);
  if (keys.length === 0) return false;
  if (holdings.length < 2) return false;

  const stockSet = new Set(holdings.map((h) => h.stockName.toLowerCase().trim()));
  let matches = 0;
  for (const k of keys) {
    const kl = k.toLowerCase().trim();
    if (stockSet.has(kl)) matches += 1;
  }
  return matches >= Math.min(3, Math.ceil(keys.length * 0.25));
}

/**
 * Prefer holdings-aggregated sectors when cache is empty, noisy, or mis-keyed.
 */
export function resolveSectorAllocation(
  sectorAllocation: Record<string, number>,
  holdings: HoldingLike[]
): Record<string, number> {
  const fromHoldings = aggregateSectorsFromHoldings(holdings);
  const cached = Object.fromEntries(
    Object.entries(sectorAllocation || {}).filter(([, v]) => Number.isFinite(v) && v > 0)
  );

  if (Object.keys(fromHoldings).length === 0 && Object.keys(cached).length === 0) {
    return {};
  }

  if (Object.keys(cached).length === 0) {
    return rollUpSmallSectors(fromHoldings);
  }

  if (sectorsLookLikeStockNames(cached, holdings) || Object.keys(cached).length > 14) {
    return rollUpSmallSectors(fromHoldings);
  }

  return rollUpSmallSectors(cached);
}

export function topHoldings<T extends HoldingLike>(holdings: T[], limit = TOP_HOLDINGS_DISPLAY): T[] {
  return [...holdings]
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, limit);
}
