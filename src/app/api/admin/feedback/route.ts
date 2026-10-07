import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const where: {
    status?: FeedbackStatus;
    category?: FeedbackCategory;
    OR?: Array<
      | { title: { contains: string; mode: "insensitive" } }
      | { body: { contains: string; mode: "insensitive" } }
    >;
  } = {};

  if (status && (FEEDBACK_STATUSES as readonly string[]).includes(status)) {
    where.status = status as FeedbackStatus;
  }
  if (category && (FEEDBACK_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as FeedbackCategory;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: [{ status: "asc" }, { voteCount: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        category: true,
        title: true,
        body: true,
        impact: true,
        mood: true,
        status: true,
        adminNote: true,
        voteCount: true,
        decidedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.feedback.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    FEEDBACK_STATUSES.map((s) => [s, 0])
  ) as Record<FeedbackStatus, number>;
  for (const row of counts) {
    byStatus[row.status] = row._count._all;
  }

  return NextResponse.json({
    items: items.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      decidedAt: f.decidedAt?.toISOString() ?? null,
    })),
    byStatus,
  });
}
