import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/utils/crypto";
import { verifyState } from "@/lib/utils/crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/auth/login", req.url));

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/admin/clients?error=missing_params", req.url));
  }

  // Verify HMAC state
  const clientId = verifyState(state);
  if (!clientId) {
    return NextResponse.redirect(new URL("/admin/clients?error=invalid_state", req.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_PORTAL_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_PORTAL_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/hubspot/callback`,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(`/admin/clients/${clientId}?error=token_exchange`, req.url));
  }

  const tokens = await tokenRes.json();
  const { encrypted: encAccess, iv } = encrypt(tokens.access_token);
  const { encrypted: encRefresh } = encrypt(tokens.refresh_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Get portal ID from token info
  let portalId: string | null = null;
  try {
    const info = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${tokens.access_token}`);
    if (info.ok) {
      const d = await info.json();
      portalId = String(d.hub_id);
    }
  } catch {}

  await db
    .update(clients)
    .set({
      hubspotAccessToken: encAccess,
      hubspotRefreshToken: encRefresh,
      tokenIv: iv,
      tokenExpiresAt: expiresAt,
      hubspotPortalId: portalId,
    })
    .where(eq(clients.id, clientId));

  return NextResponse.redirect(new URL(`/admin/clients/${clientId}?connected=true`, req.url));
}
