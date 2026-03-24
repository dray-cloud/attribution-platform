import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchContacts } from "@/lib/hubspot/contacts";
import { fetchDeals } from "@/lib/hubspot/deals";
import { fetchPages } from "@/lib/hubspot/pages";
import { applyAttribution } from "@/lib/attribution/models";
import { resolveDateWindow } from "@/lib/utils/date-ranges";
import type { DateRange, AttrModel } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await db.query.clients.findFirst({ where: eq(clients.id, params.id) });
  if (!client?.hubspotAccessToken) {
    return NextResponse.json({ error: "Client portal not connected" }, { status: 400 });
  }

  const dateRange = (req.nextUrl.searchParams.get("dateRange") ?? "MTD") as DateRange;
  const attrModel = (req.nextUrl.searchParams.get("attrModel") ?? "linear") as AttrModel;
  const window = resolveDateWindow(dateRange);

  try {
    const [contactData, dealData] = await Promise.all([
      fetchContacts(params.id, window),
      fetchDeals(params.id, window),
    ]);

    const rawPages = await fetchPages(
      params.id,
      window,
      dealData.contactRevenue,
      contactData.byFirstUrl,
      contactData.byLastUrl
    );

    const pages = applyAttribution(rawPages, contactData.contacts, dealData.contactRevenue, attrModel);

    return NextResponse.json(pages);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
