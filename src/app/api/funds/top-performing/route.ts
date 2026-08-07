import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { FundCategory } from "@/lib/funds";
import { syncTopFundsCache } from "@/lib/sync-top-funds";
import {
  TOP_FUNDS_REDIS_KEY,
  TopFundsPayload,
  buildTopFundsHttpResponse,
  loadTopFundsPayloadFromDb,
  setTopFundsRedisPayload,
} from "@/lib/top-funds-cache";

const EXPECTED_CATEGORIES: FundCategory[] = [
  "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap",
  "ELSS", "Debt", "Hybrid", "Index Funds", "International Funds",
];
const TARGET_PER_CATEGORY = 10;

// Allow a short on-demand refill when a category is empty (e.g. after bad
// scheme codes wiped Index Funds from cache). Cron remains the primary path.
export const maxDuration = 60;
export const revalidate = 3600;

function categoryNeedsRefill(funds: TopFundsPayload[string] | undefined): boolean {
  if (!funds || funds.length < TARGET_PER_CATEGORY) return true;
  // Snapshot-only syncs leave 3Y/1Y null while 1M is filled — force refill.
  const withLongHorizon = funds.filter(
    (f) => f.returns?.["3Y"] != null || f.returns?.["1Y"] != null
  ).length;
  return withLongHorizon < Math.ceil(funds.length / 2);
}

function thinCategories(payload: TopFundsPayload | null): FundCategory[] {
  if (!payload) return [...EXPECTED_CATEGORIES];
  return EXPECTED_CATEGORIES.filter((cat) => categoryNeedsRefill(payload[cat]));
}

export async function GET() {
  try {
    if (redis) {
      try {
        const cachedPayload = await redis.get(TOP_FUNDS_REDIS_KEY);
        if (cachedPayload) {
          const parsed = JSON.parse(cachedPayload) as TopFundsPayload;
          const thin = thinCategories(parsed);
          // Serve Redis only when every category has data; otherwise refill.
          if (thin.length === 0) {
            return buildTopFundsHttpResponse(parsed);
          }
        }
      } catch (redisErr) {
        console.warn("Redis read failed for top-performing:", redisErr);
      }
    }

    let results = await loadTopFundsPayloadFromDb();
    const thin = thinCategories(results);

    if (thin.length > 0) {
      try {
        // Cap on-demand work under Vercel 60s — remaining thin cats refill on later GETs / cron.
        await syncTopFundsCache(thin.slice(0, 3));
        results = await loadTopFundsPayloadFromDb();
      } catch (syncErr) {
        console.warn("On-demand top-funds refill failed:", syncErr);
      }
    }

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
