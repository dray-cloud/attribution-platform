import { db, hubspotCache } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { getValidToken } from "./refresh";

const HS_BASE = "https://api.hubapi.com";

export async function hsGet<T>(
  clientId: string,
  path: string,
  params?: Record<string, string>,
  cacheTtlSeconds = 900
): Promise<T> {
  const searchParams = params ? "?" + new URLSearchParams(params).toString() : "";
  const cacheKey = `${clientId}:${path}${searchParams}`;

  // Check cache
  const cached = await db.query.hubspotCache.findFirst({
    where: and(
      eq(hubspotCache.clientId, clientId),
      eq(hubspotCache.cacheKey, cacheKey),
      gt(hubspotCache.expiresAt, new Date())
    ),
  });
  if (cached) return cached.data as T;

  // Fetch live
  const token = await getValidToken(clientId);
  const url = `${HS_BASE}${path}${searchParams}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HubSpot API error ${res.status}: ${path}`);
  }

  const data = await res.json() as T;

  // Store in cache (upsert)
  const expiresAt = new Date(Date.now() + cacheTtlSeconds * 1000);
  await db
    .insert(hubspotCache)
    .values({ clientId, cacheKey, data: data as object, expiresAt })
    .onConflictDoUpdate({
      target: hubspotCache.cacheKey,
      set: { data: data as object, fetchedAt: new Date(), expiresAt },
    });

  return data;
}

export async function hsPost<T>(
  clientId: string,
  path: string,
  body: unknown,
  cacheKey?: string,
  cacheTtlSeconds = 900
): Promise<T> {
  if (cacheKey) {
    const cached = await db.query.hubspotCache.findFirst({
      where: and(
        eq(hubspotCache.clientId, clientId),
        eq(hubspotCache.cacheKey, cacheKey),
        gt(hubspotCache.expiresAt, new Date())
      ),
    });
    if (cached) return cached.data as T;
  }

  const token = await getValidToken(clientId);
  const res = await fetch(`${HS_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HubSpot API error ${res.status}: ${path}`);
  }

  const data = await res.json() as T;

  if (cacheKey) {
    const expiresAt = new Date(Date.now() + cacheTtlSeconds * 1000);
    await db
      .insert(hubspotCache)
      .values({ clientId, cacheKey, data: data as object, expiresAt })
      .onConflictDoUpdate({
        target: hubspotCache.cacheKey,
        set: { data: data as object, fetchedAt: new Date(), expiresAt },
      });
  }

  return data;
}

// Fetch all pages of a search endpoint
export async function hsSearchAll<T>(
  clientId: string,
  path: string,
  body: Record<string, unknown>,
  cacheKey?: string,
  cacheTtlSeconds = 900
): Promise<T[]> {
  if (cacheKey) {
    const cached = await db.query.hubspotCache.findFirst({
      where: and(
        eq(hubspotCache.clientId, clientId),
        eq(hubspotCache.cacheKey, cacheKey),
        gt(hubspotCache.expiresAt, new Date())
      ),
    });
    if (cached) return cached.data as T[];
  }

  const token = await getValidToken(clientId);
  const all: T[] = [];
  let after: string | undefined;

  do {
    const reqBody = { ...body, limit: 100, ...(after ? { after } : {}) };
    const res = await fetch(`${HS_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      throw new Error(`HubSpot search error ${res.status}: ${path}`);
    }

    const data = await res.json();
    all.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  if (cacheKey) {
    const expiresAt = new Date(Date.now() + cacheTtlSeconds * 1000);
    await db
      .insert(hubspotCache)
      .values({ clientId, cacheKey, data: all as unknown as object, expiresAt })
      .onConflictDoUpdate({
        target: hubspotCache.cacheKey,
        set: { data: all as unknown as object, fetchedAt: new Date(), expiresAt },
      });
  }

  return all;
}
