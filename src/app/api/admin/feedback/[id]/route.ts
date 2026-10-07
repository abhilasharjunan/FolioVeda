import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, writeAdminAudit } from "@/lib/admin";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback";

const patchSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  adminNote: z.string().trim().max(2000).nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, status: true, title: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status, adminNote } = parsed.data;
  const data: {
    status?: FeedbackStatus;
    adminNote?: string | null;
    decidedAt?: Date;
    decidedById?: string;
  } = {};

  if (status !== undefined) {
    data.status = status;
    data.decidedAt = new Date();
    data.decidedById = gate.user.id;
  }
  if (adminNote !== undefined) {
    data.adminNote = adminNote;
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data,
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
  });

  if (status && status !== existing.status) {
    await writeAdminAudit({
      actorId: gate.user.id,
      action: "feedback_status",
      meta: {
        feedbackId: id,
        title: existing.title,
        from: existing.status,
        to: status,
      },
    });
  }

  return NextResponse.json({
    item: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      decidedAt: updated.decidedAt?.toISOString() ?? null,
    },
  });
}
