import { hsGet } from "./client";
import { toIso } from "@/lib/utils/date-ranges";
import { classifyPageType } from "@/lib/utils/formatters";
import type { DateWindow } from "@/lib/utils/date-ranges";
import type { PageData } from "@/types";

export async function fetchPages(
  clientId: string,
  window: DateWindow,
  contactRevenue: Record<string, number>,
  byFirstUrl: Record<string, number>,
  byLastUrl: Record<string, number>
): Promise<PageData[]> {
  // Try HubSpot CMS Analytics API
  let pageViews: Record<string, number> = {};

  try {
    const data = await hsGet<{ results?: Array<{ url?: string; views?: number }> }>(
      clientId,
      "/analytics/v2/reports/content-strategy/pages",
      {
        start: toIso(window.start),
        end: toIso(window.end),
        limit: "300",
      },
      3600 // 1hr cache
    );
    for (const row of data.results ?? []) {
      if (row.url) pageViews[row.url] = row.views ?? 0;
    }
  } catch {
    // CMS Analytics not available — use URL aggregates from contacts as fallback
    pageViews = {};
  }

  // Build page map: url → {visits, leads}
  const pageMap: Record<
    string,
    { visits: number; leads: number; lastLeads: number; value: number }
  > = {};

  // Populate from first-touch URLs (all contacts)
  for (const [url, count] of Object.entries(byFirstUrl)) {
    if (!pageMap[url]) pageMap[url] = { visits: pageViews[url] ?? 0, leads: 0, lastLeads: 0, value: 0 };
    pageMap[url].leads += count;
  }

  // Last-touch
  for (const [url, count] of Object.entries(byLastUrl)) {
    if (!pageMap[url]) pageMap[url] = { visits: pageViews[url] ?? 0, leads: 0, lastLeads: 0, value: 0 };
    pageMap[url].lastLeads += count;
  }

  // Supplement with CMS views for pages that didn't show up via contacts
  for (const [url, views] of Object.entries(pageViews)) {
    if (!pageMap[url]) pageMap[url] = { visits: views, leads: 0, lastLeads: 0, value: 0 };
    else pageMap[url].visits = Math.max(pageMap[url].visits, views);
  }

  // Convert to PageData[]
  const pages: PageData[] = Object.entries(pageMap)
    .filter(([_, d]) => d.leads > 0 || d.visits > 0)
    .map(([url, d]) => {
      // Extract a readable name from the URL
      const name = urlToName(url);
      const type = classifyPageType(url);
      return {
        name,
        url,
        type,
        visits: d.visits || d.leads * 8, // estimate visits if analytics not available
        leads: d.leads,
        value: 0, // filled in by attribution model
      };
    })
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 50);

  return pages;
}

function urlToName(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://example.com${url}`);
    const path = u.pathname.replace(/\//g, " ").replace(/-/g, " ").trim();
    return path
      ? path.charAt(0).toUpperCase() + path.slice(1)
      : u.hostname;
  } catch {
    return url.slice(0, 60);
  }
}
