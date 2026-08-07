import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TransactionSchema } from "@/lib/validations";
import { resolveSchemeForTransaction } from "@/lib/resolve-scheme";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = TransactionSchema.parse(body);

    const estimatedNav =
      validated.units > 0 ? validated.amount / validated.units : undefined;

    let resolved;
    try {
      resolved = await resolveSchemeForTransaction(
        validated.schemeCode,
        validated.schemeName,
        estimatedNav
      );
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error
          ? err.message
          : "Could not fetch scheme details from mfapi.in. The scheme code may be invalid or the API is temporarily unavailable."
      }, { status: 502 });
    }

    await prisma.schemeMaster.upsert({
      where: { schemeCode: validated.schemeCode },
      create: {
        schemeCode: validated.schemeCode,
        schemeName: resolved.schemeName,
        category: resolved.category,
        latestNav: resolved.latestNav,
      },
      update: {
        schemeName: resolved.schemeName,
        category: resolved.category,
        ...(Number(resolved.latestNav) > 0 ? { latestNav: resolved.latestNav } : {}),
      },
    });

    return await prisma.$transaction(async (tx: any) => {
      let portfolio = await tx.portfolio.findFirst({
        where: { userId: session.user.id },
      });

      if (!portfolio) {
        portfolio = await tx.portfolio.create({
          data: { userId: session.user.id },
        });
      }

      let holding = await tx.holding.findFirst({
        where: {
          portfolioId: portfolio.id,
          schemeCode: validated.schemeCode,
        },
      });

      if (!holding) {
        if (validated.type === "SELL") {
          return NextResponse.json(
            { error: "Cannot sell units for a fund you do not hold." },
            { status: 400 }
          );
        }
        holding = await tx.holding.create({
          data: {
            portfolioId: portfolio.id,
            schemeCode: validated.schemeCode,
            units: validated.units,
          },
        });
      } else {
        const delta = validated.type === "BUY" ? validated.units : -validated.units;
        const nextUnits = Number(holding.units) + Number(delta);
        if (nextUnits < -1e-9) {
          return NextResponse.json(
            { error: "Sell would reduce units below zero." },
            { status: 400 }
          );
        }
        await tx.holding.update({
          where: { id: holding.id },
          data: { units: nextUnits },
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          holdingId: holding.id,
          date: new Date(validated.date),
          amount: validated.amount,
          units: validated.units,
          type: validated.type,
        },
      });

      return NextResponse.json(transaction);
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
