import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, allowedUsers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const rows = await db.query.allowedUsers.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      notes: r.notes,
      createdAt: r.createdAt.toLocaleDateString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const Schema = z.object({
    email: z.string().email(),
    notes: z.string().optional(),
  });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await db
    .insert(allowedUsers)
    .values({ email: parsed.data.email.toLowerCase(), invitedBy: user.id, notes: parsed.data.notes })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  await db.delete(allowedUsers).where(eq(allowedUsers.email, email.toLowerCase()));

  return NextResponse.json({ ok: true });
}
