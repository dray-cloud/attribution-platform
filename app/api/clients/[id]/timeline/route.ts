import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchContacts } from "@/lib/hubspot/contacts";
import { fetchJourneyPaths } from "@/lib/hubspot/timeline";
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
    const contactData = await fetchContacts(params.id, window);
    const contactIds = contactData.contacts.map((c) => c.id);
    const paths = await fetchJourneyPaths(params.id, contactIds);
    return NextResponse.json(paths);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
