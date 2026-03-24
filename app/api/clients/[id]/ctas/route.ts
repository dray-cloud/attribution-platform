import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchCtas } from "@/lib/hubspot/ctas";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await db.query.clients.findFirst({ where: eq(clients.id, params.id) });
  if (!client?.hubspotAccessToken) {
    return NextResponse.json({ error: "Client portal not connected" }, { status: 400 });
  }

  try {
    const ctas = await fetchCtas(params.id);
    return NextResponse.json(ctas);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
