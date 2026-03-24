import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, alertRules } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const DEFAULT_RULES = [
  { metric: "spamRate", condition: "gt", threshold: 50, label: "Spam rate exceeds 50%", active: true, delivery: ["inapp", "email"] },
  { metric: "leadDrop", condition: "gt", threshold: 20, label: "Lead volume drops >20% vs prior", active: true, delivery: ["inapp"] },
  { metric: "roas", condition: "lt", threshold: 2, label: "ROAS falls below 2x", active: false, delivery: ["inapp", "email"] },
  { metric: "closeRate", condition: "lt", threshold: 15, label: "Close rate drops below 15%", active: true, delivery: ["inapp"] },
  { metric: "cpl", condition: "gt", threshold: 120, label: "Cost per lead exceeds $120", active: false, delivery: ["email"] },
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.alertRules.findMany({
    where: eq(alertRules.userId, user.id),
  });

  // Seed defaults if user has no rules yet
  if (rows.length === 0) {
    const inserted = await db
      .insert(alertRules)
      .values(DEFAULT_RULES.map((r) => ({ ...r, userId: user.id! })))
      .returning();
    return NextResponse.json(
      inserted.map((r) => ({
        id: r.id,
        metric: r.metric,
        condition: r.condition,
        threshold: r.threshold,
        label: r.label,
        active: r.active,
        delivery: r.delivery,
      }))
    );
  }

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      metric: r.metric,
      condition: r.condition,
      threshold: r.threshold,
      label: r.label,
      active: r.active,
      delivery: r.delivery,
    }))
  );
}

const PatchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  delivery: z.array(z.string()).optional(),
  threshold: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { id, ...updates } = parsed.data;
  await db
    .update(alertRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(alertRules.id, id), eq(alertRules.userId, user.id)));

  return NextResponse.json({ ok: true });
}
