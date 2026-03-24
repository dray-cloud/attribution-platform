import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clientSpend } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  const periodKey = req.nextUrl.searchParams.get("periodKey") ?? "default";
  if (!clientId) return NextResponse.json({ services: 0, hubspot: 0, ads: 0 });

  const row = await db.query.clientSpend.findFirst({
    where: and(eq(clientSpend.clientId, clientId), eq(clientSpend.periodKey, periodKey)),
  });

  return NextResponse.json({
    services: row?.servicesCost ?? 3500,
    hubspot: row?.hubspotCost ?? 800,
    ads: row?.adSpend ?? 4200,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, periodKey = "default", services, hubspot, ads } = await req.json();
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  await db
    .insert(clientSpend)
    .values({
      clientId,
      periodKey,
      servicesCost: services ?? 0,
      hubspotCost: hubspot ?? 0,
      adSpend: ads ?? 0,
    })
    .onConflictDoUpdate({
      target: [clientSpend.clientId, clientSpend.periodKey],
      set: {
        servicesCost: services ?? 0,
        hubspotCost: hubspot ?? 0,
        adSpend: ads ?? 0,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
