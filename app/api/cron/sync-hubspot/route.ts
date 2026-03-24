import { NextRequest, NextResponse } from "next/server";
import { db, clients } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { fetchContacts } from "@/lib/hubspot/contacts";
import { fetchDeals } from "@/lib/hubspot/deals";
import { resolveDateWindow } from "@/lib/utils/date-ranges";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeClients = await db.query.clients.findMany({
    where: and(eq(clients.active, true)),
  });

  const results: { clientId: string; status: string }[] = [];

  for (const client of activeClients) {
    if (!client.hubspotAccessToken) {
      results.push({ clientId: client.id, status: "skipped (no token)" });
      continue;
    }

    try {
      const window = resolveDateWindow("MTD");
      await fetchContacts(client.id, window);
      await fetchDeals(client.id, window);
      results.push({ clientId: client.id, status: "synced" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown error";
      results.push({ clientId: client.id, status: `error: ${message}` });
    }
  }

  return NextResponse.json({ synced: results });
}
