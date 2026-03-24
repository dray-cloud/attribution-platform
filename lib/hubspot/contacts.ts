import { hsSearchAll } from "./client";
import { toIso } from "@/lib/utils/date-ranges";
import { classifyPageType } from "@/lib/utils/formatters";
import type { DateWindow } from "@/lib/utils/date-ranges";

export interface HsContact {
  id: string;
  properties: {
    email?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    hs_analytics_source?: string;
    hs_analytics_source_data_1?: string;
    hs_analytics_source_data_2?: string;
    hs_analytics_first_url?: string;
    hs_analytics_last_url?: string;
    zip?: string;
    createdate?: string;
  };
}

export interface ContactSummary {
  total: number;
  sqls: number;
  byMonth: Record<string, number>;
  bySource: Record<string, number>;
  byZip: Record<string, { leads: number; sqls: number }>;
  byFirstUrl: Record<string, number>;
  byLastUrl: Record<string, number>;
  byKeyword: Record<string, number>;
  byLeadStatus: Record<string, number>;
  contacts: HsContact[];
}

export async function fetchContacts(
  clientId: string,
  window: DateWindow
): Promise<ContactSummary> {
  const cacheKey = `${clientId}:contacts:${toIso(window.start)}:${toIso(window.end)}`;

  const contacts = await hsSearchAll<HsContact>(
    clientId,
    "/crm/v3/objects/contacts/search",
    {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "createdate",
              operator: "GTE",
              value: String(window.start.getTime()),
            },
            {
              propertyName: "createdate",
              operator: "LTE",
              value: String(window.end.getTime()),
            },
          ],
        },
      ],
      properties: [
        "email",
        "lifecyclestage",
        "hs_lead_status",
        "hs_analytics_source",
        "hs_analytics_source_data_1",
        "hs_analytics_source_data_2",
        "hs_analytics_first_url",
        "hs_analytics_last_url",
        "zip",
        "createdate",
      ],
      sorts: [{ propertyName: "createdate", direction: "ASCENDING" }],
    },
    cacheKey,
    900 // 15 min cache
  );

  const summary: ContactSummary = {
    total: contacts.length,
    sqls: 0,
    byMonth: {},
    bySource: {},
    byZip: {},
    byFirstUrl: {},
    byLastUrl: {},
    byKeyword: {},
    byLeadStatus: {},
    contacts,
  };

  for (const c of contacts) {
    const p = c.properties;

    // SQLs
    if (p.lifecyclestage === "salesqualifiedlead") summary.sqls++;

    // By month
    const month = p.createdate
      ? new Date(p.createdate).toLocaleString("en-US", { month: "short" })
      : "Unknown";
    summary.byMonth[month] = (summary.byMonth[month] ?? 0) + 1;

    // By source
    const src = p.hs_analytics_source ?? "DIRECT_TRAFFIC";
    summary.bySource[src] = (summary.bySource[src] ?? 0) + 1;

    // By zip
    const zip = p.zip ?? "Unknown";
    if (!summary.byZip[zip]) summary.byZip[zip] = { leads: 0, sqls: 0 };
    summary.byZip[zip].leads++;
    if (p.lifecyclestage === "salesqualifiedlead") summary.byZip[zip].sqls++;

    // By first/last URL
    if (p.hs_analytics_first_url) {
      const url = p.hs_analytics_first_url;
      summary.byFirstUrl[url] = (summary.byFirstUrl[url] ?? 0) + 1;
    }
    if (p.hs_analytics_last_url) {
      const url = p.hs_analytics_last_url;
      summary.byLastUrl[url] = (summary.byLastUrl[url] ?? 0) + 1;
    }

    // By keyword (source_data_2 often holds keyword for paid search)
    if (p.hs_analytics_source === "PAID_SEARCH" && p.hs_analytics_source_data_2) {
      const kw = p.hs_analytics_source_data_2;
      summary.byKeyword[kw] = (summary.byKeyword[kw] ?? 0) + 1;
    }

    // By lead status (for spam/disqualified analysis)
    if (p.hs_lead_status) {
      const ls = p.hs_lead_status;
      summary.byLeadStatus[ls] = (summary.byLeadStatus[ls] ?? 0) + 1;
    }
  }

  return summary;
}
