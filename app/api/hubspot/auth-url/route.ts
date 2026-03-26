import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { signState } from "@/lib/utils/crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const state = signState(clientId);
  const origin = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.headers.get("host")}`;
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_PORTAL_ID!,
    redirect_uri: `${origin}/api/hubspot/callback`,
    scope: "contacts deals content crm.objects.contacts.read crm.objects.deals.read",
    state,
  });

  const url = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  return NextResponse.json({ url });
}
