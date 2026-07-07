import { NextResponse } from "next/server";
import { syncTopFundsCache } from "@/lib/sync-top-funds";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cronSecret = searchParams.get("key");

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncTopFundsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Top funds cache sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
