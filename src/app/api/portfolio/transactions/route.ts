import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TransactionSchema } from "@/lib/validations";
import { fetchSchemeDetails } from "@/lib/mfapi";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = TransactionSchema.parse(body);

    let schemeData: any;
    try {
      schemeData = await fetchSchemeDetails(validated.schemeCode);
    } catch {
      return NextResponse.json({
        error: "Could not fetch scheme details from mfapi.in. The scheme code may be invalid or the API is temporarily unavailable."
      }, { status: 502 });
    }
    const meta = schemeData.meta as { scheme_name?: string; scheme_category?: string };
    const navEntries = schemeData.data as Array<{ date: string; nav: string }>;
    // mfapi.in returns NAV history newest-first — data[0] is the latest NAV
    // (same convention used by /api/funds/batch). Using the last element stored
    // a stale/oldest NAV into SchemeMaster.
    const latestNav = navEntries.length > 0 ? navEntries[0].nav : "0";

    await prisma.schemeMaster.upsert({
      where: { schemeCode: validated.schemeCode },
      create: {
        schemeCode: validated.schemeCode,
        schemeName: meta?.scheme_name || "Unknown Fund",
        category: meta?.scheme_category || null,
        latestNav: latestNav,
      },
      update: {
        schemeName: meta?.scheme_name || "Unknown Fund",
        category: meta?.scheme_category || null,
        latestNav: latestNav,
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
