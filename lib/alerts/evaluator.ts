import { db, alertRules, notifications, clients, users } from "@/lib/db";
import { eq, and, gte, isNull, or } from "drizzle-orm";
import { sendAlertEmail } from "@/lib/email/sender";
import { fetchContacts } from "@/lib/hubspot/contacts";
import { fetchDeals } from "@/lib/hubspot/deals";
import { resolveDateWindow } from "@/lib/utils/date-ranges";

export async function runAlertEvaluation(): Promise<void> {
  const activeRules = await db.query.alertRules.findMany({
    where: eq(alertRules.active, true),
  });

  const allClients = await db.query.clients.findMany({
    where: and(eq(clients.active, true)),
  });

  for (const client of allClients) {
    if (!client.hubspotAccessToken) continue;

    // Fetch MTD data for this client
    let contacts, deals;
    try {
      const window = resolveDateWindow("MTD");
      contacts = await fetchContacts(client.id, window);
      deals = await fetchDeals(client.id, window);
    } catch {
      continue;
    }

    const totalSpend = 0; // Would need spend config - use 0 as fallback
    const spamCount = Object.values(contacts.byLeadStatus).reduce((s, v) => s + v, 0);
    const spamRate = contacts.total > 0 ? (spamCount / contacts.total) * 100 : 0;
    const roas = totalSpend > 0 ? deals.revenue / totalSpend : 0;
    const closeRate = deals.total > 0 ? (deals.closed / deals.total) * 100 : 0;
    const cpl = contacts.total > 0 ? totalSpend / contacts.total : 0;

    const metrics: Record<string, number> = {
      spamRate,
      roas,
      closeRate,
      cpl,
      leadDrop: 0, // Would require comparing to prior period
    };

    const rulesForClient = activeRules.filter(
      (r) => r.clientId === client.id || r.clientId === null
    );

    for (const rule of rulesForClient) {
      const value = metrics[rule.metric] ?? 0;
      const triggered =
        rule.condition === "gt" ? value > rule.threshold : value < rule.threshold;

      if (!triggered) continue;

      // Check if we already notified in the last 24h
      const recentNotif = await db.query.notifications.findFirst({
        where: and(
          eq(notifications.alertRuleId, rule.id),
          gte(notifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        ),
      });
      if (recentNotif) continue;

      // Create in-app notification
      await db.insert(notifications).values({
        userId: rule.userId,
        clientId: client.id,
        alertRuleId: rule.id,
        type: "alert",
        severity: "medium",
        message: `${rule.label} — current value: ${value.toFixed(1)}`,
        read: false,
      });

      // Send email if configured
      if (rule.delivery.includes("email")) {
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, rule.userId),
          });
          if (user?.email) {
            await sendAlertEmail({
              to: user.email,
              subject: `[Alert] ${rule.label} — ${client.name}`,
              alertLabel: rule.label,
              message: `${rule.label}. Current value: ${value.toFixed(1)}. Threshold: ${rule.threshold}.`,
              clientName: client.name,
              severity: "medium",
              dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard/${client.id}`,
            });
          }
        } catch {
          // Email sending is best-effort — don't fail the whole evaluation
        }
      }
    }
  }
}
