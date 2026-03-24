import { db, clients } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/utils/crypto";

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export async function getValidToken(clientId: string): Promise<string> {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client?.hubspotAccessToken || !client.tokenIv) {
    throw new Error(`Client ${clientId} has no HubSpot token. Connect the portal first.`);
  }

  // Decrypt current tokens
  const accessToken = decrypt(client.hubspotAccessToken, client.tokenIv);

  // If token expires more than 5 minutes from now, use it directly
  if (client.tokenExpiresAt && client.tokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return accessToken;
  }

  // Need to refresh
  if (!client.hubspotRefreshToken) {
    throw new Error(`Client ${clientId} has no refresh token. Re-connect the portal.`);
  }
  const refreshToken = decrypt(client.hubspotRefreshToken, client.tokenIv);

  const tokens = await refreshTokens(refreshToken);

  // Encrypt and store new tokens
  const { encrypted: encAccess, iv } = encrypt(tokens.accessToken);
  const { encrypted: encRefresh } = encrypt(tokens.refreshToken);

  await db
    .update(clients)
    .set({
      hubspotAccessToken: encAccess,
      hubspotRefreshToken: encRefresh,
      tokenIv: iv,
      tokenExpiresAt: tokens.expiresAt,
    })
    .where(eq(clients.id, clientId));

  return tokens.accessToken;
}

async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.HUBSPOT_CLIENT_PORTAL_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_PORTAL_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}
