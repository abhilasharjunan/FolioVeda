import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export type AdminSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
};

/** Emails in ADMIN_EMAILS (comma-separated) are promoted to ADMIN on login if still USER. */
export function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().has(email.toLowerCase());
}

export async function requireAdmin(): Promise<
  { ok: true; user: AdminSessionUser } | { ok: false; status: 401 | 403; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = (session.user as { role?: UserRole }).role;
  if (role !== "ADMIN") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return {
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: "ADMIN",
    },
  };
}

export async function writeAdminAudit(params: {
  actorId: string;
  action: string;
  targetUserId?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetUserId: params.targetUserId ?? null,
      meta: (params.meta as object | undefined) ?? undefined,
    },
  });
}

/** Safe user shape for admin APIs — never includes password or holding details. */
export const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  disabledAt: true,
  lastLoginAt: true,
  consentGiven: true,
  consentDate: true,
  createdAt: true,
  updatedAt: true,
  portfolios: {
    select: {
      id: true,
      updatedAt: true,
      _count: { select: { holdings: true } },
    },
  },
} as const;

export function mapAdminUserRow(user: {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  disabledAt: Date | null;
  lastLoginAt: Date | null;
  consentGiven: boolean;
  consentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  portfolios: Array<{ id: string; updatedAt: Date; _count: { holdings: number } }>;
}) {
  const holdingCount = user.portfolios.reduce((sum, p) => sum + p._count.holdings, 0);
  const portfolioUpdatedAt =
    user.portfolios.length > 0
      ? user.portfolios.reduce(
          (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
          user.portfolios[0].updatedAt
        )
      : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    disabledAt: user.disabledAt,
    lastLoginAt: user.lastLoginAt,
    consentGiven: user.consentGiven,
    consentDate: user.consentDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    hasPortfolio: holdingCount > 0,
    holdingCount,
    portfolioUpdatedAt,
  };
}
