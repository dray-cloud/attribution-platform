import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, serviceAreas } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ mode: "radius", address: "", radiusMiles: 25, zips: [], counties: [] });

  const row = await db.query.serviceAreas.findFirst({ where: eq(serviceAreas.clientId, clientId) });

  return NextResponse.json({
    mode: row?.mode ?? "radius",
    address: row?.address ?? "",
    radiusMiles: row?.radiusMiles ?? 25,
    zips: row?.zips ?? [],
    counties: row?.counties ?? [],
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, mode, address, radiusMiles, zips, counties } = await req.json();
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  await db
    .insert(serviceAreas)
    .values({ clientId, mode, address, radiusMiles, zips: zips ?? [], counties: counties ?? [] })
    .onConflictDoUpdate({
      target: serviceAreas.clientId,
      set: { mode, address, radiusMiles, zips: zips ?? [], counties: counties ?? [], updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
