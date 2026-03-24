"use client";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  logoInitials: string;
  primaryColor: string;
  hubspotPortalId: string | null;
  hubspotAccessToken: string | null;
  active: boolean;
}

export function ClientCard({ client }: { client: Client }) {
  const connected = !!client.hubspotAccessToken;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ height: 4, background: client.primaryColor }} />
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: client.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {client.logoInitials}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{client.name}</div>
            {client.industry && <div style={{ fontSize: 12, color: "#888" }}>{client.industry}</div>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#1D6A3A" : "#aaa" }} />
          <span style={{ fontSize: 12, color: connected ? "#1D6A3A" : "#aaa", fontWeight: 600 }}>
            {connected ? "HubSpot Connected" : "Not Connected"}
          </span>
          {client.hubspotPortalId && <span style={{ fontSize: 11, color: "#aaa" }}>· Portal {client.hubspotPortalId}</span>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {connected && (
            <Link href={`/dashboard/${client.id}`}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: client.primaryColor, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
              View Dashboard
            </Link>
          )}
          <Link href={`/admin/clients/${client.id}`}
            style={{ flex: connected ? undefined : 1, padding: "8px 14px", borderRadius: 8, border: `1px solid ${client.primaryColor}`, color: client.primaryColor, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
            {connected ? "Manage" : "Connect HubSpot"}
          </Link>
        </div>
      </div>
    </div>
  );
}
