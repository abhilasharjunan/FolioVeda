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
  fallbackName?: string,
  estimatedNav?: number
): Promise<ResolvedScheme> {
  const existing = await prisma.schemeMaster.findUnique({
    where: { schemeCode },
    select: { schemeCode: true, schemeName: true, category: true, latestNav: true },
  });

  if (existing && Number(existing.latestNav) > 0) {
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
      schemeName: meta?.scheme_name || catalog?.schemeName || fallbackName || existing?.schemeName || "Unknown Fund",
      category: meta?.scheme_category || catalog?.category || existing?.category || null,
      latestNav: Number(latestNav) > 0 ? latestNav : (estimatedNav && estimatedNav > 0 ? String(estimatedNav) : "0"),
    };
  } catch (err) {
    console.warn(`mfapi.in unavailable for ${schemeCode}, using local fallback:`, err);

    const navFromEstimate = estimatedNav && estimatedNav > 0 ? String(estimatedNav) : "0";
    const navFromExisting = existing && Number(existing.latestNav) > 0 ? String(existing.latestNav) : null;

    if (catalog || fallbackName || existing || navFromEstimate !== "0") {
      return {
        schemeCode,
        schemeName: catalog?.schemeName || fallbackName || existing?.schemeName || "Unknown Fund",
        category: catalog?.category || existing?.category || null,
        latestNav: navFromExisting || navFromEstimate,
      };
    }

    throw new Error(
      "Could not fetch scheme details from mfapi.in. The scheme code may be invalid or the API is temporarily unavailable."
    );
  }
}
