import { prisma } from "@/lib/prisma";
import { fetchSchemeDetails } from "@/lib/mfapi";

/**
 * Ensure SchemeMaster rows have a usable latestNav.
 * - Refreshes from mfapi.in when NAV is missing/zero
 * - Falls back to cost-basis NAV (total invested / units) from transactions
 *
 * Returns a map of schemeCode → { schemeName, category, latestNav }
 */
export async function ensureSchemeNavs(schemeCodes: string[]): Promise<
  Map<string, { schemeName: string; category: string | null; latestNav: number }>
> {
  const unique = [...new Set(schemeCodes.filter(Boolean))];
  const result = new Map<string, { schemeName: string; category: string | null; latestNav: number }>();
  if (unique.length === 0) return result;

  const existing = await prisma.schemeMaster.findMany({
    where: { schemeCode: { in: unique } },
    select: { schemeCode: true, schemeName: true, category: true, latestNav: true },
  });
  const existingMap = new Map(existing.map((s) => [s.schemeCode, s]));

  const needsRefresh = unique.filter((code) => {
    const row = existingMap.get(code);
    return !row || Number(row.latestNav) <= 0;
  });

  if (needsRefresh.length > 0) {
    await Promise.allSettled(
      needsRefresh.map(async (code) => {
        try {
          const data = await fetchSchemeDetails(code);
          const meta = data.meta as { scheme_name?: string; scheme_category?: string };
          const navEntries = data.data as Array<{ date: string; nav: string }>;
          const latestNav = navEntries.length > 0 ? navEntries[0].nav : "0";
          if (Number(latestNav) <= 0) return;

          const schemeName =
            meta?.scheme_name || existingMap.get(code)?.schemeName || `Scheme ${code}`;
          const category = meta?.scheme_category || existingMap.get(code)?.category || null;

          await prisma.schemeMaster.upsert({
            where: { schemeCode: code },
            create: { schemeCode: code, schemeName, category, latestNav },
            update: { schemeName, category, latestNav, lastUpdated: new Date() },
          });
          existingMap.set(code, {
            schemeCode: code,
            schemeName,
            category,
            latestNav: latestNav as unknown as typeof existing[0]["latestNav"],
          });
        } catch (err) {
          console.warn(`ensureSchemeNavs: mfapi failed for ${code}`, err);
        }
      })
    );
  }

  // Cost-basis fallback for any codes still without NAV
  const stillMissing = unique.filter((code) => {
    const row = existingMap.get(code);
    return !row || Number(row.latestNav) <= 0;
  });

  if (stillMissing.length > 0) {
    const holdings = await prisma.holding.findMany({
      where: { schemeCode: { in: stillMissing } },
      include: { transactions: true },
    });

    for (const holding of holdings) {
      const units = Number(holding.units);
      if (units <= 0) continue;
      const invested = holding.transactions.reduce((sum, tx) => {
        const amt = Number(tx.amount);
        return tx.type === "BUY" ? sum + amt : sum - amt;
      }, 0);
      if (invested <= 0) continue;

      const estimatedNav = invested / units;
      const prior = existingMap.get(holding.schemeCode);
      const schemeName = prior?.schemeName || `Scheme ${holding.schemeCode}`;
      const category = prior?.category || null;

      await prisma.schemeMaster.upsert({
        where: { schemeCode: holding.schemeCode },
        create: {
          schemeCode: holding.schemeCode,
          schemeName,
          category,
          latestNav: estimatedNav,
        },
        update: {
          latestNav: estimatedNav,
          lastUpdated: new Date(),
        },
      });

      existingMap.set(holding.schemeCode, {
        schemeCode: holding.schemeCode,
        schemeName,
        category,
        latestNav: estimatedNav as unknown as typeof existing[0]["latestNav"],
      });
    }
  }

  for (const code of unique) {
    const row = existingMap.get(code);
    if (!row) continue;
    result.set(code, {
      schemeName: row.schemeName,
      category: row.category,
      latestNav: Number(row.latestNav) || 0,
    });
  }

  return result;
}
