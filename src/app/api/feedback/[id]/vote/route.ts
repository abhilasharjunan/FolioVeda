import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: feedbackId } = await ctx.params;
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, status: true },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (feedback.status === "DECLINED") {
    return NextResponse.json({ error: "This item is closed" }, { status: 400 });
  }

  const existing = await prisma.feedbackVote.findUnique({
    where: {
      feedbackId_userId: { feedbackId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.feedbackVote.delete({ where: { id: existing.id } }),
      prisma.feedback.update({
        where: { id: feedbackId },
        data: { voteCount: { decrement: 1 } },
      }),
    ]);
    const updated = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { voteCount: true },
    });
    return NextResponse.json({ voted: false, voteCount: Math.max(0, updated?.voteCount ?? 0) });
  }

  await prisma.$transaction([
    prisma.feedbackVote.create({
      data: { feedbackId, userId: session.user.id },
    }),
    prisma.feedback.update({
      where: { id: feedbackId },
      data: { voteCount: { increment: 1 } },
    }),
  ]);

  const updated = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { voteCount: true },
  });
  return NextResponse.json({ voted: true, voteCount: updated?.voteCount ?? 0 });
}
