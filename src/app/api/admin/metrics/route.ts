import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAccounts,
    signups7d,
    signups30d,
    disabledCount,
    neverLoggedIn,
    usersWithHoldingsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.user.count({ where: { lastLoginAt: null } }),
    prisma.user.findMany({
      select: {
        id: true,
        portfolios: { select: { _count: { select: { holdings: true } } } },
      },
    }),
  ]);

  let withHoldings = 0;
  for (const u of usersWithHoldingsAgg) {
    const n = u.portfolios.reduce((s, p) => s + p._count.holdings, 0);
    if (n > 0) withHoldings += 1;
  }
  const emptyPortfolio = totalAccounts - withHoldings;

  // Signups last 14 days for a simple chart
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key] += 1;
  }

  const logs = await prisma.adminAuditLog.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      targetUserId: true,
      meta: true,
      createdAt: true,
      actor: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    kpis: {
      totalAccounts,
      signups7d,
      signups30d,
      disabledCount,
      withHoldings,
      emptyPortfolio,
      neverLoggedIn,
    },
    funnel: {
      signedUp: totalAccounts,
      loggedInAtLeastOnce: totalAccounts - neverLoggedIn,
      hasHoldings: withHoldings,
    },
    signupsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    auditLog: logs,
    traffic: {
      provider: "vercel",
      note: "Anonymous visits, geography, and engagement live in Vercel Web Analytics.",
      dashboardUrl:
        process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_URL ||
        "https://vercel.com/dashboard",
    },
  });
}
