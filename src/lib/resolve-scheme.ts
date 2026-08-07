import { prisma } from "@/lib/prisma";
import { fetchSchemeDetails } from "@/lib/mfapi";

export type ResolvedScheme = {
  schemeCode: string;
  schemeName: string;
  category: string | null;
  latestNav: string;
};

/**
 * Resolve scheme metadata for portfolio writes without hard-failing when
 * mfapi.in is slow or unavailable. Prefer DB, then live API, then safe fallback.
 */
export async function resolveSchemeForTransaction(
  schemeCode: string,
  fallbackName?: string
): Promise<ResolvedScheme> {
  const existing = await prisma.schemeMaster.findUnique({
    where: { schemeCode },
    select: { schemeCode: true, schemeName: true, category: true, latestNav: true },
  });

  if (existing) {
    return {
      schemeCode: existing.schemeCode,
      schemeName: existing.schemeName,
      category: existing.category,
      latestNav: String(existing.latestNav),
    };
  }

  const catalog = await prisma.schemeCatalog.findUnique({
    where: { schemeCode },
    select: { schemeName: true, category: true },
  }).catch(() => null);

  try {
    const schemeData = await fetchSchemeDetails(schemeCode);
    const meta = schemeData.meta as { scheme_name?: string; scheme_category?: string };
    const navEntries = schemeData.data as Array<{ date: string; nav: string }>;
    const latestNav = navEntries.length > 0 ? navEntries[0].nav : "0";

    return {
      schemeCode,
      schemeName: meta?.scheme_name || catalog?.schemeName || fallbackName || "Unknown Fund",
      category: meta?.scheme_category || catalog?.category || null,
      latestNav,
    };
  } catch (err) {
    console.warn(`mfapi.in unavailable for ${schemeCode}, using local fallback:`, err);

    if (catalog || fallbackName) {
      return {
        schemeCode,
        schemeName: catalog?.schemeName || fallbackName || "Unknown Fund",
        category: catalog?.category || null,
        latestNav: "0",
      };
    }

    throw new Error(
      "Could not fetch scheme details from mfapi.in. The scheme code may be invalid or the API is temporarily unavailable."
    );
  }
}
