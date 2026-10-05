import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetEmail } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link was sent." });
    }

    if (user.disabledAt) {
      // Same generic message — do not reveal account status.
      return NextResponse.json({ message: "If that email exists, a reset link was sent." });
    }

    await issuePasswordResetEmail(email);

    return NextResponse.json({ message: "If that email exists, a reset link was sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
