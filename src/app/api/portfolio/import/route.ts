import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseAndValidateCSV } from "@/lib/csv-engine";
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { csvData } = await req.json();
    if (!csvData) return NextResponse.json({ error: "No CSV data provided" }, { status: 400 });

    const { data, errors } = await parseAndValidateCSV(csvData);
    
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "No portfolio found. Please create one first." }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      for (const row of data) {
        const holding = await tx.holding.upsert({
          // One Holding per (portfolio, scheme). Repeated CAS/CSV rows for the
          // same fund accumulate units onto this single row instead of creating
          // a duplicate holding per transaction.
          where: {
            portfolioId_schemeCode: {
              portfolioId: portfolio.id,
              schemeCode: row.schemeCode,
            },
          },
          update: { units: { increment: row.units } },
          create: {
            portfolioId: portfolio.id,
            schemeCode: row.schemeCode,
            units: row.units,
          },
        });

        await tx.transaction.create({
          data: {
            holdingId: holding.id,
            date: new Date(row.date),
            amount: row.investedAmount,
            units: row.units,
            type: "BUY",
          },
        });
      }
    });

    return NextResponse.json({ success: true, imported: data.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
