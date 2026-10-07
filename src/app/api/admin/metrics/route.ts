import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const IST = "Asia/Kolkata";
const OPEN_FEEDBACK = ["NEW", "UNDER_REVIEW"] as const;

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Last `days` calendar dates in India, oldest first, as YYYY-MM-DD. */
function recentDayKeys(now: Date, days: number): string[] {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(Date.UTC(y, m - 1, d - i, 12, 0, 0))));
  }
  return keys;
}

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
    logins7d,
    logins30d,
    disabledCount,
    neverLoggedIn,
    withGoals,
    usersWithHoldingsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d7 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: d30 } } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.user.count({ where: { lastLoginAt: null } }),
    prisma.user.count({
      where: { portfolios: { some: { goals: { some: {} } } } },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        portfolios: { select: { _count: { select: { holdings: true } } } },
      },
    }),
  ]);

  let withHoldings = 0;
  const holdingBands = { one: 0, twoToFive: 0, sixPlus: 0 };
  for (const u of usersWithHoldingsAgg) {
    const n = u.portfolios.reduce((s, p) => s + p._count.holdings, 0);
    if (n > 0) withHoldings += 1;
    if (n === 1) holdingBands.one += 1;
    else if (n >= 2 && n <= 5) holdingBands.twoToFive += 1;
    else if (n >= 6) holdingBands.sixPlus += 1;
  }
  const emptyPortfolio = totalAccounts - withHoldings;

  const since = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const dayKeys = recentDayKeys(now, 14);
  const byDay: Record<string, number> = Object.fromEntries(dayKeys.map((key) => [key, 0]));

  const [recentUsers, recentTransactions] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: d7 } },
      select: { holding: { select: { portfolio: { select: { userId: true } } } } },
    }),
  ]);

  for (const u of recentUsers) {
    const key = dayKey(u.createdAt);
    if (key in byDay) byDay[key] += 1;
  }

  const activeTraders = new Set(
    recentTransactions.map((t) => t.holding.portfolio.userId)
  );

  const [
    latestNav,
    catalogCount,
    catalogUpdated,
    schemesMissingRisk,
    schemeCount,
    topFundsUpdated,
    feedbackNew,
    feedbackReview,
    openBugs,
    openData,
    recentFeedback,
    logs,
  ] = await Promise.all([
    prisma.navSnapshot.findFirst({
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.schemeCatalog.count(),
    prisma.schemeCatalog.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.schemeMaster.count({ where: { riskScore: null } }),
    prisma.schemeMaster.count(),
    prisma.topFundsCache.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.feedback.count({ where: { status: "NEW" } }),
    prisma.feedback.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.feedback.count({
      where: { status: { in: [...OPEN_FEEDBACK] }, category: "BUG" },
    }),
    prisma.feedback.count({
      where: { status: { in: [...OPEN_FEEDBACK] }, category: "DATA" },
    }),
    prisma.feedback.findMany({
      where: { status: { in: [...OPEN_FEEDBACK] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.findMany({
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
    }),
  ]);

  return NextResponse.json(
    {
      kpis: {
        totalAccounts,
        signups7d,
        signups30d,
        logins7d,
        logins30d,
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
      usage: {
        withGoals,
        activeTransactions7d: activeTraders.size,
        holdingBands,
      },
      signupsByDay: dayKeys.map((date) => ({ date, count: byDay[date] ?? 0 })),
      dataHealth: {
        latestNavDate: latestNav?.date.toISOString() ?? null,
        schemeCatalogCount: catalogCount,
        schemeCatalogUpdatedAt: catalogUpdated?.updatedAt.toISOString() ?? null,
        schemesMissingRisk,
        schemeCount,
        topFundsUpdatedAt: topFundsUpdated?.updatedAt.toISOString() ?? null,
      },
      inbox: {
        newCount: feedbackNew,
        underReviewCount: feedbackReview,
        openBugs,
        openData,
        recent: recentFeedback.map((f) => ({
          id: f.id,
          title: f.title,
          category: f.category,
          status: f.status,
          createdAt: f.createdAt.toISOString(),
        })),
      },
      auditLog: logs,
      traffic: {
        provider: "vercel",
        note: "Anonymous visits, geography, and engagement live in Vercel Web Analytics.",
        dashboardUrl:
          process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_URL ||
          "https://vercel.com/dashboard",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
