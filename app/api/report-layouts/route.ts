import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, reportLayouts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { REPORT_SECTIONS } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ sections: REPORT_SECTIONS.map((s) => s.id) });

  const row = await db.query.reportLayouts.findFirst({
    where: and(
      eq(reportLayouts.userId, user.id),
      eq(reportLayouts.clientId, clientId)
    ),
  });

  return NextResponse.json({
    sections: row?.sections ?? REPORT_SECTIONS.map((s) => s.id),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, sections } = await req.json();
  if (!clientId || !Array.isArray(sections)) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await db
    .insert(reportLayouts)
    .values({ userId: user.id, clientId, sections, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [reportLayouts.userId, reportLayouts.clientId],
      set: { sections, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
