import { db } from "@/lib/db";
import { clients, users, allowedUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminPage() {
  const [allClients, allUsers, allInvites] = await Promise.all([
    db.query.clients.findMany({ where: eq(clients.active, true) }),
    db.query.users.findMany(),
    db.query.allowedUsers.findMany(),
  ]);

  const connectedClients = allClients.filter(c => c.hubspotAccessToken);

  const stats = [
    { label: "Total Clients", value: allClients.length, icon: "🏢" },
    { label: "HubSpot Connected", value: connectedClients.length, icon: "🔗" },
    { label: "Active Users", value: allUsers.length, icon: "👥" },
    { label: "Invite Slots", value: allInvites.length, icon: "📧" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Admin Overview</h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Manage clients, users, and platform settings.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #eee", borderTop: "3px solid #6C3483" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "20px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/admin/clients/new"
              style={{ padding: "10px 16px", borderRadius: 10, background: "#6C3483", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              + Add New Client
            </Link>
            <Link href="/admin/invites"
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #6C3483", color: "#6C3483", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              Manage Invites
            </Link>
            <Link href="/admin/clients"
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #eee", color: "#555", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              View All Clients
            </Link>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "20px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>Unconnected Clients</div>
          {allClients.filter(c => !c.hubspotAccessToken).length === 0 ? (
            <div style={{ fontSize: 13, color: "#888" }}>All clients are connected to HubSpot. ✓</div>
          ) : (
            allClients.filter(c => !c.hubspotAccessToken).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: c.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>{c.logoInitials}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                </div>
                <Link href={`/admin/clients/${c.id}`}
                  style={{ fontSize: 11, color: "#6C3483", fontWeight: 600, textDecoration: "none" }}>Connect →</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
