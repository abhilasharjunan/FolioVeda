import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";

const createSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(4000),
  impact: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const mine = searchParams.get("mine") === "1";
  const status = searchParams.get("status");

  const where: {
    userId?: string;
    category?: FeedbackCategory;
    status?: { in: FeedbackStatus[] };
  } = {};

  if (mine) where.userId = session.user.id;
  if (category && (FEEDBACK_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as FeedbackCategory;
  }

  // Community board: only show items admins have accepted into the pipeline (or still new)
  if (!mine) {
    where.status = {
      in: ["NEW", "UNDER_REVIEW", "PLANNED", "IN_PROGRESS", "DONE"],
    };
    if (status === "DECLINED") {
      // hide declined from public board
      return NextResponse.json({ items: [] });
    }
  }

  const items = await prisma.feedback.findMany({
    where,
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      category: true,
      title: true,
      body: true,
      impact: true,
      mood: true,
      status: true,
      voteCount: true,
      createdAt: true,
      user: { select: { name: true } },
      votes: {
        where: { userId: session.user.id },
        select: { id: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    items: items.map((f) => ({
      id: f.id,
      category: f.category,
      title: f.title,
      body: f.body,
      impact: f.impact,
      mood: f.mood,
      status: f.status,
      voteCount: f.voteCount,
      createdAt: f.createdAt.toISOString(),
      authorName: f.user.name?.split(" ")[0] || "Investor",
      votedByMe: f.votes.length > 0,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const recent = await prisma.feedback.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (recent >= 3) {
    return NextResponse.json(
      { error: "Slow down — please wait a minute before sending more feedback." },
      { status: 429 }
    );
  }

  const created = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
    select: {
      id: true,
      category: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
