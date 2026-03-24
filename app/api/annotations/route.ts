import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, annotations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  const periodKey = req.nextUrl.searchParams.get("periodKey");
  if (!clientId || !periodKey) return NextResponse.json([], { status: 200 });

  const rows = await db.query.annotations.findMany({
    where: and(
      eq(annotations.userId, user.id),
      eq(annotations.clientId, clientId),
      eq(annotations.periodKey, periodKey)
    ),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      month: r.month,
      text: r.text,
      type: r.type,
      created: r.createdAt.toLocaleDateString(),
    }))
  );
}

const CreateSchema = z.object({
  clientId: z.string().uuid(),
  periodKey: z.string(),
  month: z.string(),
  text: z.string().min(1),
  type: z.enum(["campaign", "content", "pause", "budget", "other"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [row] = await db
    .insert(annotations)
    .values({ ...parsed.data, userId: user.id })
    .returning();

  return NextResponse.json({
    id: row.id,
    month: row.month,
    text: row.text,
    type: row.type,
    created: row.createdAt.toLocaleDateString(),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(annotations).where(
    and(eq(annotations.id, id), eq(annotations.userId, user.id))
  );

  return NextResponse.json({ ok: true });
}
