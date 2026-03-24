import { hsSearchAll, hsGet } from "./client";
import { toIso } from "@/lib/utils/date-ranges";
import type { DateWindow } from "@/lib/utils/date-ranges";

export interface HsDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    closedate?: string;
    dealstage?: string;
    pipeline?: string;
    createdate?: string;
  };
  associations?: {
    contacts?: { results: Array<{ id: string }> };
  };
}

export interface DealSummary {
  total: number;
  closed: number;
  revenue: number;
  byMonth: Record<string, { deals: number; revenue: number; closed: number }>;
  byStage: Record<string, number>;
  deals: HsDeal[];
  // contact_id -> deal amount (for attribution)
  contactRevenue: Record<string, number>;
}

export async function fetchDeals(clientId: string, window: DateWindow): Promise<DealSummary> {
  const cacheKey = `${clientId}:deals:${toIso(window.start)}:${toIso(window.end)}`;

  const deals = await hsSearchAll<HsDeal>(
    clientId,
    "/crm/v3/objects/deals/search",
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
      properties: ["dealname", "amount", "closedate", "dealstage", "pipeline", "createdate"],
      associations: ["contacts"],
    },
    cacheKey,
    900
  );

  const summary: DealSummary = {
    total: deals.length,
    closed: 0,
    revenue: 0,
    byMonth: {},
    byStage: {},
    deals,
    contactRevenue: {},
  };

  for (const deal of deals) {
    const p = deal.properties;
    const amount = parseFloat(p.amount ?? "0") || 0;
    const isClosedWon =
      p.dealstage === "closedwon" ||
      (p.dealstage ?? "").toLowerCase().includes("closed won") ||
      (p.dealstage ?? "").toLowerCase().includes("closed_won");

    const month = p.closedate
      ? new Date(p.closedate).toLocaleString("en-US", { month: "short" })
      : p.createdate
      ? new Date(p.createdate).toLocaleString("en-US", { month: "short" })
      : "Unknown";

    if (!summary.byMonth[month]) summary.byMonth[month] = { deals: 0, revenue: 0, closed: 0 };
    summary.byMonth[month].deals++;

    if (isClosedWon) {
      summary.closed++;
      summary.revenue += amount;
      summary.byMonth[month].revenue += amount;
      summary.byMonth[month].closed++;

      // Map contact revenue for attribution
      const contactIds =
        deal.associations?.contacts?.results?.map((r) => r.id) ?? [];
      for (const cid of contactIds) {
        summary.contactRevenue[cid] = (summary.contactRevenue[cid] ?? 0) + amount;
      }
    }

    // By stage
    const stage = p.dealstage ?? "unknown";
    summary.byStage[stage] = (summary.byStage[stage] ?? 0) + 1;
  }

  return summary;
}
