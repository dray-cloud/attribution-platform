import { hsGet } from "./client";
import type { CtaData } from "@/types";

interface HsCta {
  id: string;
  name?: string;
  stats?: { views?: number; clicks?: number; clickThroughRate?: number };
  associatedLandingPage?: { url?: string };
}

export async function fetchCtas(clientId: string): Promise<CtaData[]> {
  try {
    const data = await hsGet<{ results?: HsCta[] }>(
      clientId,
      "/marketing/v3/ctas",
      { limit: "100" },
      3600
    );

    return (data.results ?? []).map((cta) => ({
      id: cta.id,
      name: cta.name ?? "Unnamed CTA",
      page: cta.associatedLandingPage?.url ?? "Unknown Page",
      clicks: cta.stats?.clicks ?? 0,
      conversions: Math.floor((cta.stats?.clicks ?? 0) * (cta.stats?.clickThroughRate ?? 0) / 100),
      rate: cta.stats?.clickThroughRate ?? 0,
    }));
  } catch {
    return [];
  }
}
