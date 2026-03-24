import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchDeals } from "@/lib/hubspot/deals";
import { resolveDateWindow } from "@/lib/utils/date-ranges";
import type { DateRange } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await db.query.clients.findFirst({ where: eq(clients.id, params.id) });
  if (!client?.hubspotAccessToken) {
    return NextResponse.json({ error: "Client portal not connected" }, { status: 400 });
  }

  const dateRange = (req.nextUrl.searchParams.get("dateRange") ?? "MTD") as DateRange;
  const window = resolveDateWindow(dateRange);

  try {
    const data = await fetchDeals(params.id, window);
    const { deals: _deals, ...summary } = data;
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
