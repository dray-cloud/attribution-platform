import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConnectPortalButton } from "@/components/admin/ConnectPortalButton";
import Link from "next/link";

interface Props {
  params: { id: string };
  searchParams: { connected?: string };
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, params.id),
  });

  if (!client) notFound();

  const connected = !!client.hubspotAccessToken;
  const justConnected = searchParams.connected === "true";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Link href="/admin/clients" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>← Clients</Link>
        <span style={{ color: "#ddd" }}>/</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: client.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
            {client.logoInitials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{client.name}</div>
            {client.industry && <div style={{ fontSize: 12, color: "#888" }}>{client.industry}</div>}
          </div>
        </div>
      </div>

      {justConnected && (
        <div style={{ padding: "12px 18px", background: "#f0faf4", border: "1px solid #a8e6c0", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "#1D6A3A", fontWeight: 600 }}>
          ✓ HubSpot portal connected successfully! Data will start syncing shortly.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Connection status */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>HubSpot Connection</div>
          <ConnectPortalButton
            clientId={client.id}
            clientName={client.name}
            accent={client.primaryColor}
            connected={connected}
          />
        </div>

        {/* Client info */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>Client Details</div>
          {[
            ["ID", client.id],
            ["Portal ID", client.hubspotPortalId ?? "—"],
            ["Status", client.active ? "Active" : "Inactive"],
            ["Created", new Date(client.createdAt).toLocaleDateString()],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
              <span style={{ color: "#888" }}>{l}</span>
              <span style={{ fontWeight: 600, color: "#1a1a1a", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
            </div>
          ))}

          {connected && (
            <Link href={`/dashboard/${client.id}`}
              style={{ display: "block", marginTop: 16, padding: "10px 0", borderRadius: 10, background: client.primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              View Dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
