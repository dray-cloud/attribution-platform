import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ClientCard } from "@/components/admin/ClientCard";
import Link from "next/link";

export default async function ClientsPage() {
  const allClients = await db.query.clients.findMany({
    where: eq(clients.active, true),
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{allClients.length} client{allClients.length !== 1 ? "s" : ""} configured</p>
        </div>
        <Link href="/admin/clients/new"
          style={{ padding: "10px 20px", borderRadius: 10, background: "#6C3483", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          + Add Client
        </Link>
      </div>

      {allClients.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", border: "1px solid #eee" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>No clients yet</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Create your first client and connect their HubSpot portal.</div>
          <Link href="/admin/clients/new"
            style={{ padding: "10px 24px", borderRadius: 10, background: "#6C3483", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            + Add First Client
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {allClients.map(c => (
            <ClientCard key={c.id} client={{
              id: c.id,
              name: c.name,
              industry: c.industry,
              logoInitials: c.logoInitials,
              primaryColor: c.primaryColor,
              hubspotPortalId: c.hubspotPortalId,
              hubspotAccessToken: c.hubspotAccessToken,
              active: c.active,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
