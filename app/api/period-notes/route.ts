import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, periodNotes } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  const periodKey = req.nextUrl.searchParams.get("periodKey");
  if (!clientId || !periodKey) return NextResponse.json({ text: "", saved: null });

  const row = await db.query.periodNotes.findFirst({
    where: and(
      eq(periodNotes.userId, user.id),
      eq(periodNotes.clientId, clientId),
      eq(periodNotes.periodKey, periodKey)
    ),
  });

  return NextResponse.json({
    text: row?.text ?? "",
    saved: row?.updatedAt?.toLocaleString() ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, periodKey, text } = await req.json();
  if (!clientId || !periodKey) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  await db
    .insert(periodNotes)
    .values({ userId: user.id, clientId, periodKey, text: text ?? "" })
    .onConflictDoUpdate({
      target: [periodNotes.userId, periodNotes.clientId, periodNotes.periodKey],
      set: { text: text ?? "", updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, saved: new Date().toLocaleString() });
}
