import { NextRequest, NextResponse } from "next/server";
import { seedSchemeCatalog } from "@/lib/scheme-seed";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
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
