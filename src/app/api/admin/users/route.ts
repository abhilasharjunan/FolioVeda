import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_USER_SELECT,
  mapAdminUserRow,
  requireAdmin,
} from "@/lib/admin";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(Number(searchParams.get("limit") || 50), 100);

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: ADMIN_USER_SELECT,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({
    users: users.map(mapAdminUserRow),
  });
}
