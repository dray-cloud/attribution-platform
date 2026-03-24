import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, notifications, clients } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { timeAgo } from "@/lib/utils/formatters";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, user.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
    with: { clientId: true },
  });

  // Fetch client names separately
  const allClients = await db.query.clients.findMany();
  const clientMap = Object.fromEntries(allClients.map((c) => [c.id, c.name]));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      message: r.message,
      time: timeAgo(r.createdAt),
      read: r.read,
      clientName: r.clientId ? (clientMap[r.clientId] ?? "Unknown") : "All clients",
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, user.id));
  } else if (id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  }

  return NextResponse.json({ ok: true });
}
