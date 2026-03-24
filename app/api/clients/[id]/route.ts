import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, params.id),
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: client.id,
    name: client.name,
    industry: client.industry,
    logoInitials: client.logoInitials,
    primaryColor: client.primaryColor,
    secondaryColor: client.secondaryColor,
    accentColor: client.accentColor,
    hubspotPortalId: client.hubspotPortalId,
    connected: !!(client.hubspotAccessToken && client.tokenExpiresAt),
    tokenExpiresAt: client.tokenExpiresAt,
    active: client.active,
  });
}

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().optional(),
  logoInitials: z.string().max(2).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.role || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await db.update(clients).set(parsed.data).where(eq(clients.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.role || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  await db.update(clients).set({ active: false }).where(eq(clients.id, params.id));
  return NextResponse.json({ ok: true });
}
