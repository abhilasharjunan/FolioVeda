/** Factsheet / disclosure dates from FinAPI or SectorCache (YYYY-MM or ISO day). */
export function formatFactsheetAsOf(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();

  if (/^\d{4}-\d{2}$/.test(t)) {
    const [y, m] = t.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  }

  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(new Date(parsed));
  }

  return t;
}

export function formatCacheTimestamp(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(parsed));
}
