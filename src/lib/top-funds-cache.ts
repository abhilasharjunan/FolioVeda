import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

/** Shared Redis key for GET /api/funds/top-performing payload. */
export const TOP_FUNDS_REDIS_KEY = "funds:top-performing:v2";
export const TOP_FUNDS_REDIS_TTL_SECONDS = 24 * 60 * 60; // 24h — matches daily cron cadence

export type TopFundsPayload = Record<
  string,
  Array<{
    schemeCode: string;
    schemeName: string;
    fundHouse: string | null;
    nav: number;
    returns: Record<string, number | null>;
    sinceInception: number | null;
    rank: number;
  }>
>;

export function buildTopFundsHttpResponse(results: TopFundsPayload, status = 200) {
  // Vercel CDN headers take priority over Cache-Control for edge caching of
  // dynamic route handlers; keep Cache-Control for non-Vercel CDNs/proxies.
  return NextResponse.json(results, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Vercel-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function loadTopFundsPayloadFromDb(): Promise<TopFundsPayload | null> {
  const cached = await prisma.topFundsCache.findMany({
    orderBy: [{ category: "asc" }, { rank: "asc" }],
  });
  if (cached.length === 0) return null;

  const results: TopFundsPayload = {};
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
  return results;
}

export async function setTopFundsRedisPayload(results: TopFundsPayload): Promise<void> {
  if (!redis) return;
  await redis.set(
    TOP_FUNDS_REDIS_KEY,
    JSON.stringify(results),
    "EX",
    TOP_FUNDS_REDIS_TTL_SECONDS
  );
}

/** Rebuild Redis from Postgres after sync so readers never refill from a partial DB snapshot mid-race. */
export async function refreshTopFundsRedisFromDb(): Promise<void> {
  if (!redis) return;
  try {
    const payload = await loadTopFundsPayloadFromDb();
    if (payload) {
      await setTopFundsRedisPayload(payload);
    } else {
      await redis.del(TOP_FUNDS_REDIS_KEY);
    }
  } catch (err) {
    console.warn("Failed to refresh top-funds Redis payload:", err);
  }
}
