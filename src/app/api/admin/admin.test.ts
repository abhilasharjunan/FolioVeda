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
      create: vi.fn(),
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
});
