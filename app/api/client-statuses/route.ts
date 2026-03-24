import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clientStatuses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json([]);

  const rows = await db.query.clientStatuses.findMany({
    where: eq(clientStatuses.clientId, clientId),
    orderBy: (t, { asc }) => [asc(t.sortOrder)],
  });

  return NextResponse.json(rows.map((r) => ({ id: r.statusId, label: r.label, color: r.color })));
}

const StatusSchema = z.object({
  clientId: z.string().uuid(),
  statuses: z.array(z.object({ id: z.string(), label: z.string(), color: z.string() })),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { clientId, statuses } = parsed.data;

  // Replace all statuses for this client
  await db.delete(clientStatuses).where(eq(clientStatuses.clientId, clientId));
  if (statuses.length > 0) {
    await db.insert(clientStatuses).values(
      statuses.map((s, i) => ({
        clientId,
        statusId: s.id,
        label: s.label,
        color: s.color,
        sortOrder: i,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
