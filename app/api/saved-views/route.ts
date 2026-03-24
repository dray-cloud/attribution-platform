import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, savedViews } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.savedViews.findMany({
    where: eq(savedViews.userId, user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      clientId: r.clientId,
      dateRange: r.dateRange,
      attrModel: r.attrModel,
      pageFilter: r.pageFilter,
      nav: r.nav,
      comparePeriod: r.comparePeriod,
      created: r.createdAt.toLocaleDateString(),
    }))
  );
}

const CreateSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  dateRange: z.string(),
  attrModel: z.string(),
  pageFilter: z.string(),
  nav: z.string(),
  comparePeriod: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [row] = await db
    .insert(savedViews)
    .values({ ...parsed.data, userId: user.id })
    .returning();

  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(savedViews).where(
    and(eq(savedViews.id, id), eq(savedViews.userId, user.id))
  );

  return NextResponse.json({ ok: true });
}
