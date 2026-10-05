import { NextRequest, NextResponse } from "next/server";
import { getFundDetail } from "@/lib/fund-detail";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Scheme ID is required" }, { status: 400 });
    }

    const detail = await getFundDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // Backward-compatible aliases used by older clients
    return NextResponse.json({
      ...detail,
      cagrReturns: {
        "1Y": detail.periodReturns["1Y"] ?? null,
        "3Y": detail.periodReturns["3Y"] ?? null,
        "5Y": detail.periodReturns["5Y"] ?? null,
      },
      fundManagerName: detail.fundManager?.name ?? null,
      fundManagerTenure: detail.fundManager?.tenure ?? null,
      volatility: null,
      sharpeRatio: null,
      sortinoRatio: null,
      maxDrawdown: null,
      maxDrawdownDuration: null,
      alpha: null,
      beta: null,
      rSquared: null,
      treynorRatio: null,
    });
  } catch (error) {
    console.error("Fund Insights API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
