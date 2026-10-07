import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin")>("@/lib/admin");
  return {
    ...actual,
    requireAdmin: vi.fn(),
    writeAdminAudit: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    adminAuditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    feedback: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    navSnapshot: {
      findFirst: vi.fn(),
    },
    schemeCatalog: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    schemeMaster: {
      count: vi.fn(),
    },
    topFundsCache: {
      findFirst: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/password-reset", () => ({
  issuePasswordResetEmail: vi.fn(),
}));

import { requireAdmin, mapAdminUserRow, ADMIN_USER_SELECT } from "@/lib/admin";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { GET as getMetrics } from "@/app/api/admin/metrics/route";
import { POST as postUserOp } from "@/app/api/admin/users/[id]/route";
import { prisma } from "@/lib/prisma";

describe("admin APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for non-admin on users list", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: false,
      status: 403,
      error: "Forbidden",
    });
    const res = await getUsers(new Request("http://localhost/api/admin/users"));
    expect(res.status).toBe(403);
  });

  it("counts recent logins separately from signups", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });
    vi.mocked(prisma.user.count).mockImplementation(async (args?: { where?: Record<string, unknown> }) => {
      const where = args?.where;
      if (!where) return 10;
      if ("createdAt" in where) return 2;
      if (
        where.lastLoginAt &&
        typeof where.lastLoginAt === "object" &&
        "gte" in (where.lastLoginAt as object)
      ) {
        return 4;
      }
      if (where.lastLoginAt === null) return 3;
      if ("disabledAt" in where) return 1;
      if ("portfolios" in where) return 2;
      return 0;
    });
    vi.mocked(prisma.user.findMany).mockImplementation(async (args?: { select?: Record<string, unknown> }) => {
      if (args?.select && "createdAt" in args.select && !("id" in args.select)) {
        return [{ createdAt: new Date() }] as never;
      }
      return [{ id: "u1", portfolios: [{ _count: { holdings: 3 } }] }] as never;
    });
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { holding: { portfolio: { userId: "u1" } } },
      { holding: { portfolio: { userId: "u1" } } },
    ] as never);
    vi.mocked(prisma.navSnapshot.findFirst).mockResolvedValue({
      date: new Date("2026-10-01T00:00:00.000Z"),
    } as never);
    vi.mocked(prisma.schemeCatalog.count).mockResolvedValue(120);
    vi.mocked(prisma.schemeCatalog.findFirst).mockResolvedValue({ updatedAt: new Date() } as never);
    vi.mocked(prisma.schemeMaster.count).mockImplementation(async (args?: { where?: unknown }) =>
      args?.where ? 5 : 80
    );
    vi.mocked(prisma.topFundsCache.findFirst).mockResolvedValue({ updatedAt: new Date() } as never);
    vi.mocked(prisma.feedback.count).mockResolvedValue(1);
    vi.mocked(prisma.feedback.findMany).mockResolvedValue([]);
    vi.mocked(prisma.adminAuditLog.findMany).mockResolvedValue([]);

    const res = await getMetrics();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.kpis.signups7d).toBe(2);
    expect(body.kpis.signups30d).toBe(2);
    expect(body.kpis.logins7d).toBe(4);
    expect(body.kpis.logins30d).toBe(4);
    expect(body.usage.activeTransactions7d).toBe(1);
    expect(body.usage.holdingBands.twoToFive).toBe(1);
    expect(body.signupsByDay).toHaveLength(14);
    expect(body.signupsByDay.reduce((sum: number, day: { count: number }) => sum + day.count, 0)).toBe(1);
    expect(body.dataHealth.schemeCatalogCount).toBe(120);
    expect(body.dataHealth.schemesMissingRisk).toBe(5);
    expect(body.inbox.newCount).toBe(1);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("filters the user list to people who have never logged in", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    const res = await getUsers(
      new Request("http://localhost/api/admin/users?filter=never_logged_in")
    );
    expect(res.status).toBe(200);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ lastLoginAt: null }] },
      })
    );
  });

  it("returns 403 for non-admin on metrics", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: false,
      status: 403,
      error: "Forbidden",
    });
    const res = await getMetrics();
    expect(res.status).toBe(403);
  });

  it("users list never includes password or holding scheme fields", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: "u1",
        name: "Test",
        email: "t@x.com",
        role: "USER",
        disabledAt: null,
        lastLoginAt: null,
        consentGiven: true,
        consentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        portfolios: [{ id: "p1", updatedAt: new Date(), _count: { holdings: 2 } }],
      },
    ] as any);

    const res = await getUsers(new Request("http://localhost/api/admin/users"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.users[0].email).toBe("t@x.com");
    expect(body.users[0].holdingCount).toBe(2);
    expect(body.users[0].hasPortfolio).toBe(true);
    expect(body.users[0].password).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/schemeCode|units|amount/i);

    const selectArg = vi.mocked(prisma.user.findMany).mock.calls[0][0]?.select as Record<
      string,
      unknown
    >;
    expect(selectArg).toEqual(ADMIN_USER_SELECT);
    expect(selectArg.password).toBeUndefined();
  });

  it("mapAdminUserRow strips to safe fields only", () => {
    const mapped = mapAdminUserRow({
      id: "u1",
      name: "N",
      email: "e@x.com",
      role: "USER",
      disabledAt: null,
      lastLoginAt: null,
      consentGiven: true,
      consentDate: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      portfolios: [],
    });
    expect(Object.keys(mapped).sort()).toEqual(
      [
        "consentDate",
        "consentGiven",
        "createdAt",
        "disabledAt",
        "email",
        "hasPortfolio",
        "holdingCount",
        "id",
        "lastLoginAt",
        "name",
        "portfolioUpdatedAt",
        "role",
        "updatedAt",
      ].sort()
    );
  });

  it("disable blocks self-disable", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });
    const res = await postUserOp(
      new Request("http://localhost/api/admin/users/admin-1", {
        method: "POST",
        body: JSON.stringify({ action: "disable" }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("delete removes a non-admin user and blocks self-delete", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });

    const self = await postUserOp(
      new Request("http://localhost/api/admin/users/admin-1", {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) }
    );
    expect(self.status).toBe(400);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u2",
      email: "user@x.com",
      role: "USER",
      disabledAt: null,
    } as any);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);
    vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });

    const res = await postUserOp(
      new Request("http://localhost/api/admin/users/u2", {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
      }),
      { params: Promise.resolve({ id: "u2" }) }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(body.user).toBeNull();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u2" } });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email: "user@x.com" },
    });
  });

  it("delete blocks deleting another admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", email: "a@x.com", name: "A", role: "ADMIN" },
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-2",
      email: "b@x.com",
      role: "ADMIN",
      disabledAt: null,
    } as any);

    const res = await postUserOp(
      new Request("http://localhost/api/admin/users/admin-2", {
        method: "POST",
        body: JSON.stringify({ action: "delete" }),
      }),
      { params: Promise.resolve({ id: "admin-2" }) }
    );
    expect(res.status).toBe(400);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
