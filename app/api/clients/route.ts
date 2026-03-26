import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.query.clients.findMany({
    where: eq(clients.active, true),
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return NextResponse.json(
    all.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      logoInitials: c.logoInitials,
      primaryColor: c.primaryColor,
      secondaryColor: c.secondaryColor,
      accentColor: c.accentColor,
      hubspotPortalId: c.hubspotPortalId,
      connected: !!(c.hubspotAccessToken && c.tokenExpiresAt),
      active: c.active,
    }))
  );
}

const CreateSchema = z.object({
  name: z.string().min(1),
  industry: z.string().default(""),
  logoInitials: z.string().max(3).default(""),
  primaryColor: z.string().default("#1A5276"),
  secondaryColor: z.string().default("#154360"),
  accentColor: z.string().default("#7FB3D3"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.role || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [client] = await db
    .insert(clients)
    .values({ ...parsed.data, connectedBy: user.id })
    .returning();

  return NextResponse.json({ id: client.id });
}
