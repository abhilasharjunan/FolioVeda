import { NextRequest, NextResponse } from "next/server";
import { seedSchemeCatalog } from "@/lib/scheme-seed";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await seedSchemeCatalog();
    return NextResponse.json({ success: true, message: `Catalog seeded with ${count} schemes.` });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
