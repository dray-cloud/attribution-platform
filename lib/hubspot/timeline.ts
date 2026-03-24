import { hsSearchAll } from "./client";
import type { JourneyPath } from "@/types";

export async function fetchJourneyPaths(
  clientId: string,
  contactIds: string[]
): Promise<JourneyPath[]> {
  // Fetch up to 20 recent contacts' timeline for individual journey view
  const sample = contactIds.slice(0, 20);
  const paths: JourneyPath[] = [];

  for (const contactId of sample) {
    try {
      const events = await hsSearchAll<{
        objectType?: string;
        timestamp?: string;
        properties?: { hs_page_url?: string; hs_referrer?: string; source?: string };
      }>(
        clientId,
        `/crm/v3/objects/contacts/${contactId}/associations/timeline-events`,
        {},
        undefined,
        900
      );

      // Build path from timeline events
      const pageSteps: string[] = [];
      for (const ev of events) {
        const url = ev.properties?.hs_page_url;
        if (url) {
          const name = url.replace(/^https?:\/\/[^/]+/, "").replace(/-/g, " ").trim() || "/";
          if (!pageSteps.includes(name)) pageSteps.push(name);
        }
      }

      paths.push({
        id: contactId,
        contact: `Contact ${contactId.slice(-4)}`,
        path: pageSteps.length > 0 ? pageSteps : ["Direct"],
        converted: false, // filled in by caller
        value: 0,
      });
    } catch {
      // Skip contacts where timeline fails
    }
  }

  return paths;
}
