import { NextResponse } from "next/server";
import { syncTopFundsCache, CATEGORY_BATCHES } from "@/lib/sync-top-funds";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 9 categories of live mfapi.in lookups don't reliably fit in one
  // invocation under Vercel's time limit, so vercel.json schedules this route
  // three times a day, once per `batch` index, each covering 3 categories.
  // Omitting `batch` (e.g. manual/local runs) still processes all of them.
  const { searchParams } = new URL(req.url);
  const batchParam = searchParams.get("batch");
  const categories = batchParam !== null ? CATEGORY_BATCHES[Number(batchParam)] : undefined;

  if (batchParam !== null && !categories) {
    return NextResponse.json({ error: `Invalid batch index: ${batchParam}` }, { status: 400 });
  }

  try {
    await syncTopFundsCache(categories);
    return NextResponse.json({ success: true, categories: categories ?? "all" });
  } catch (error) {
    console.error("Top funds cache sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
