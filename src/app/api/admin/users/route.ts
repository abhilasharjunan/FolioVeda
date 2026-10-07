import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_USER_SELECT,
  mapAdminUserRow,
  requireAdmin,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

const FILTERS = [
  "never_logged_in",
  "empty_portfolio",
  "disabled",
  "no_consent",
  "stale_portfolio",
] as const;

type UserFilter = (typeof FILTERS)[number];

function isUserFilter(value: string): value is UserFilter {
  return (FILTERS as readonly string[]).includes(value);
}

function userWhere(q: string, filter: UserFilter | null) {
  const and: object[] = [];
  if (q) {
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  switch (filter) {
    case "never_logged_in":
      and.push({ lastLoginAt: null });
      break;
    case "disabled":
      and.push({ disabledAt: { not: null } });
      break;
    case "no_consent":
      and.push({ consentGiven: false });
      break;
    case "empty_portfolio":
      and.push({
        NOT: { portfolios: { some: { holdings: { some: {} } } } },
      });
      break;
    case "stale_portfolio":
      and.push({
        portfolios: { some: {} },
        NOT: { portfolios: { some: { updatedAt: { gte: staleBefore } } } },
      });
      break;
    default:
      break;
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const rawFilter = (searchParams.get("filter") || "").trim();
  const filter = isUserFilter(rawFilter) ? rawFilter : null;
  const take = Math.min(Number(searchParams.get("limit") || 50), 100);

  const users = await prisma.user.findMany({
    where: userWhere(q, filter),
    select: ADMIN_USER_SELECT,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(
    { users: users.map(mapAdminUserRow) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
