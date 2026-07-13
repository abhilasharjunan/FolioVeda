import { NextResponse } from "next/server";
import { syncAmfiUniverse } from "@/lib/sync-amfi";

export const dynamic = 'force-dynamic';

/**
 * Previously this looped over every held scheme sequentially, calling
 * mfapi.in once per scheme just to read the latest NAV. Now it does one bulk
 * fetch of AMFI's daily NAVAll.txt (every scheme in the country, one HTTP
 * call) and writes latestNav + a full scheme catalog from that single pull —
 * see src/lib/sync-amfi.ts and src/lib/amfi.ts.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cronSecret = searchParams.get("key");

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAmfiUniverse();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AMFI NAV sync failed:", error);
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
