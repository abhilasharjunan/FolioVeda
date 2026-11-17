export type SortDir = "asc" | "desc";

/** Null / NaN / empty string sort after real values in both directions. */
export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  dir: SortDir
): number {
  const aMissing =
    a == null || a === "" || (typeof a === "number" && !Number.isFinite(a));
  const bMissing =
    b == null || b === "" || (typeof b === "number" && !Number.isFinite(b));
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  let cmp: number;
  if (typeof a === "string" && typeof b === "string") {
    cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  } else {
    cmp = Number(a) - Number(b);
  }
  return dir === "asc" ? cmp : -cmp;
}

export function sortByAccessor<T>(
  items: T[],
  accessor: (item: T) => string | number | null | undefined,
  dir: SortDir
): T[] {
  return [...items].sort((a, b) => compareSortValues(accessor(a), accessor(b), dir));
}
