import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clients, clientSpend } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { ClientRecord, ClientSpend } from "@/types";

interface Props {
  params: { clientId: string };
}

export default async function DashboardPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const [client, allClients, spendRow] = await Promise.all([
    db.query.clients.findFirst({
      where: and(eq(clients.id, params.clientId), eq(clients.active, true)),
    }),
    db.query.clients.findMany({
      where: eq(clients.active, true),
      columns: {
        id: true, name: true, industry: true, logoInitials: true,
        primaryColor: true, secondaryColor: true, accentColor: true,
        hubspotPortalId: true, active: true,
        // Explicitly exclude token fields
      },
    }),
    db.query.clientSpend.findFirst({
      where: eq(clientSpend.clientId, params.clientId),
      orderBy: [desc(clientSpend.updatedAt)],
    }),
  ]);

  if (!client) notFound();

  // Strip sensitive token fields before passing to client component
  const activeClient: ClientRecord = {
    id: client.id,
    name: client.name,
    industry: client.industry,
    logoInitials: client.logoInitials,
    primaryColor: client.primaryColor,
    secondaryColor: client.secondaryColor ?? client.primaryColor,
    accentColor: client.accentColor ?? client.primaryColor,
    hubspotPortalId: client.hubspotPortalId,
    active: client.active,
  };

  const safeClients: ClientRecord[] = allClients.map(c => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    logoInitials: c.logoInitials,
    primaryColor: c.primaryColor,
    secondaryColor: c.secondaryColor ?? c.primaryColor,
    accentColor: c.accentColor ?? c.primaryColor,
    hubspotPortalId: c.hubspotPortalId,
    active: c.active,
  }));

  const initialSpend: ClientSpend = {
    services: spendRow?.servicesCost ?? 3500,
    hubspot: spendRow?.hubspotCost ?? 800,
    ads: spendRow?.adSpend ?? 4200,
  };

  return (
    <DashboardShell
      clients={safeClients}
      activeClient={activeClient}
      initialSpend={initialSpend}
    />
  );
}
