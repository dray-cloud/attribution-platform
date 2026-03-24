import type { PageData, AttrModel } from "@/types";
import type { HsContact } from "@/lib/hubspot/contacts";

/**
 * Apply an attribution model to distribute deal revenue across pages.
 *
 * MVP limitations (documented in UI tooltips):
 * - Linear: 50/50 split between first_url and last_url (true linear = full timeline)
 * - Decay: 30/70 split toward last touch (true decay = full timeline)
 * - First: 100% to first_url
 * - Last: 100% to last_url
 */
export function applyAttribution(
  pages: PageData[],
  contacts: HsContact[],
  contactRevenue: Record<string, number>, // contactId -> deal revenue
  model: AttrModel
): PageData[] {
  // Build a map of page value contributions
  const pageValue: Record<string, number> = {};

  for (const contact of contacts) {
    const revenue = contactRevenue[contact.id] ?? 0;
    if (revenue === 0) continue;

    const firstUrl = contact.properties.hs_analytics_first_url ?? "";
    const lastUrl = contact.properties.hs_analytics_last_url ?? "";

    switch (model) {
      case "first":
        if (firstUrl) pageValue[firstUrl] = (pageValue[firstUrl] ?? 0) + revenue;
        break;
      case "last":
        if (lastUrl) pageValue[lastUrl] = (pageValue[lastUrl] ?? 0) + revenue;
        break;
      case "linear":
        // 50/50 between first and last (proxy for true linear)
        if (firstUrl && lastUrl && firstUrl !== lastUrl) {
          pageValue[firstUrl] = (pageValue[firstUrl] ?? 0) + revenue * 0.5;
          pageValue[lastUrl] = (pageValue[lastUrl] ?? 0) + revenue * 0.5;
        } else {
          const url = firstUrl || lastUrl;
          if (url) pageValue[url] = (pageValue[url] ?? 0) + revenue;
        }
        break;
      case "decay":
        // 30/70 toward last touch
        if (firstUrl && lastUrl && firstUrl !== lastUrl) {
          pageValue[firstUrl] = (pageValue[firstUrl] ?? 0) + revenue * 0.3;
          pageValue[lastUrl] = (pageValue[lastUrl] ?? 0) + revenue * 0.7;
        } else {
          const url = lastUrl || firstUrl;
          if (url) pageValue[url] = (pageValue[url] ?? 0) + revenue;
        }
        break;
    }
  }

  // Apply values to page list (match by URL)
  return pages.map((page) => ({
    ...page,
    value: Math.round(
      Object.entries(pageValue).find(([url]) => url === page.url)?.[1] ??
        0
    ),
  }));
}
