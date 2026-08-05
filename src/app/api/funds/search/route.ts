import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const cacheKey = `search:${query.toLowerCase()}`;

    try {
      const cachedData = redis ? await redis.get(cacheKey) : null;
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    } catch {
      // Redis unavailable
    }

    let localResults: { schemeCode: string; schemeName: string }[] = [];

    try {
      localResults = await prisma.schemeCatalog.findMany({
        where: {
          schemeName: { contains: query, mode: "insensitive" },
        },
        take: 10,
        select: { schemeCode: true, schemeName: true },
      });
    } catch (dbErr) {
      console.warn("DB search failed (table may not exist yet), falling back to external API:", dbErr);
    }

    if (localResults.length >= 10) {
      try {
        if (redis) await redis.set(cacheKey, JSON.stringify(localResults), 'EX', 3600);
      } catch {
        // Redis unavailable
      }
      return NextResponse.json(localResults);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        return NextResponse.json(localResults);
      }

      const remoteData = await response.json();
      const remoteResults = (remoteData as Array<{ schemeCode: number | string; schemeName: string }>)
        .map(item => ({
          schemeCode: String(item.schemeCode),
          schemeName: item.schemeName,
        }));

      for (const item of remoteResults) {
        prisma.schemeCatalog.upsert({
          where: { schemeCode: item.schemeCode },
          update: { schemeName: item.schemeName },
          create: {
            schemeCode: item.schemeCode,
            schemeName: item.schemeName,
          },
        }).catch(() => {});
      }

      const remoteCodes = new Set(remoteResults.map(r => r.schemeCode));
      const merged = [
        ...remoteResults,
        ...localResults.filter(l => !remoteCodes.has(l.schemeCode)),
      ].slice(0, 10);

      try {
        if (redis) await redis.set(cacheKey, JSON.stringify(merged), 'EX', 3600);
      } catch {
        // Redis unavailable
      }

      return NextResponse.json(merged);
    } catch (remoteErr) {
      console.warn("External search failed, returning local results:", remoteErr);
      return NextResponse.json(localResults);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([]);
  }
}
