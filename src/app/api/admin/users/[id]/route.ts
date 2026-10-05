import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_USER_SELECT,
  mapAdminUserRow,
  requireAdmin,
  writeAdminAudit,
} from "@/lib/admin";
import { issuePasswordResetEmail } from "@/lib/password-reset";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["disable", "enable", "force_password_reset", "revoke_sessions"]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id: targetUserId } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action } = parsed.data;

  if (targetUserId === gate.user.id && (action === "disable" || action === "revoke_sessions")) {
    return NextResponse.json(
      { error: "Cannot disable or revoke your own admin session this way." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, disabledAt: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "disable") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        disabledAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    });
    await prisma.session.deleteMany({ where: { userId: targetUserId } });
  } else if (action === "enable") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { disabledAt: null },
    });
  } else if (action === "force_password_reset") {
    await issuePasswordResetEmail(target.email);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { sessionVersion: { increment: 1 } },
    });
    await prisma.session.deleteMany({ where: { userId: targetUserId } });
  } else if (action === "revoke_sessions") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { sessionVersion: { increment: 1 } },
    });
    await prisma.session.deleteMany({ where: { userId: targetUserId } });
  }

  await writeAdminAudit({
    actorId: gate.user.id,
    action,
    targetUserId,
    meta: { targetEmail: target.email },
  });

  const updated = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: ADMIN_USER_SELECT,
  });

  return NextResponse.json({
    ok: true,
    user: updated ? mapAdminUserRow(updated) : null,
  });
}
