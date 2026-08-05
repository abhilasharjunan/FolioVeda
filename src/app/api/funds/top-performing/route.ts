import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export const dynamic = 'force-dynamic';

const REDIS_KEY = "funds:top-performing:v2";
const REDIS_TTL_SECONDS = 24 * 60 * 60; // 24h — matches daily cron cadence

function buildResponse(results: Record<string, unknown[]>, status = 200) {
  return NextResponse.json(results, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET() {
  try {
    if (redis) {
      try {
        const cachedPayload = await redis.get(REDIS_KEY);
        if (cachedPayload) {
          return buildResponse(JSON.parse(cachedPayload));
        }
      } catch (redisErr) {
        console.warn("Redis read failed for top-performing:", redisErr);
      }
    }

    const cached = await prisma.topFundsCache.findMany({
      orderBy: [{ category: 'asc' }, { rank: 'asc' }],
    });

    if (cached.length > 0) {
      const results: Record<string, any[]> = {};
      for (const entry of cached) {
        if (!results[entry.category]) results[entry.category] = [];
        results[entry.category].push({
          schemeCode: entry.schemeCode,
          schemeName: entry.schemeName,
          fundHouse: entry.fundHouse,
          nav: Number(entry.nav),
          returns: entry.returns as Record<string, number | null>,
          sinceInception: entry.sinceInception ? Number(entry.sinceInception) : null,
          rank: entry.rank,
        });
      }

      if (redis) {
        redis.set(REDIS_KEY, JSON.stringify(results), 'EX', REDIS_TTL_SECONDS).catch(() => {});
      }

      return buildResponse(results);
    }

    return NextResponse.json(
      { error: "Top funds cache empty. Run the daily sync-top-funds cron or re-seed the database." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Top Performing Funds API Error:", error);
    return NextResponse.json({ error: "Failed to fetch top funds" }, { status: 500 });
  }
}
