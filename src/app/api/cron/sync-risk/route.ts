import { NextRequest, NextResponse } from "next/server";
import { syncRiskMetrics } from "@/lib/risk-sync";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await syncRiskMetrics();
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated risk metrics for ${count} schemes.` 
    });
  } catch (error) {
    console.error("Sync Risk API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
