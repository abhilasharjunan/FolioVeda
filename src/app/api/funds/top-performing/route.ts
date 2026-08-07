import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import {
  TOP_FUNDS_REDIS_KEY,
  buildTopFundsHttpResponse,
  loadTopFundsPayloadFromDb,
  setTopFundsRedisPayload,
} from "@/lib/top-funds-cache";

// Public, identical-for-all payload — allow CDN caching via response headers
// (Vercel-CDN-Cache-Control) instead of force-dynamic, which opts out of edge cache.
export const revalidate = 3600;

export async function GET() {
  try {
    if (redis) {
      try {
        const cachedPayload = await redis.get(TOP_FUNDS_REDIS_KEY);
        if (cachedPayload) {
          return buildTopFundsHttpResponse(JSON.parse(cachedPayload));
        }
      } catch (redisErr) {
        console.warn("Redis read failed for top-performing:", redisErr);
      }
    }

    const results = await loadTopFundsPayloadFromDb();
    if (results) {
      setTopFundsRedisPayload(results).catch(() => {});
      return buildTopFundsHttpResponse(results);
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
