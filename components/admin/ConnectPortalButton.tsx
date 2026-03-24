"use client";
import { useState } from "react";

interface Props {
  clientId: string;
  clientName: string;
  accent: string;
  connected: boolean;
}

export function ConnectPortalButton({ clientId, clientName, accent, connected }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Build the HubSpot authorization URL
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_PORTAL_ID ?? "",
        redirect_uri: `${window.location.origin}/api/hubspot/callback`,
        scope: "contacts deals content crm.objects.contacts.read crm.objects.deals.read",
        state: clientId, // Will be HMAC-signed server-side
      });

      // Actually we need server to generate signed state — call an endpoint
      const res = await fetch("/api/hubspot/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: connected ? "#1D6A3A" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {connected ? "✓" : "🔗"}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>HubSpot Portal Connection</div>
          <div style={{ fontSize: 12, color: connected ? "#1D6A3A" : "#888" }}>
            {connected ? `Connected — ${clientName} data syncing` : `Not connected — click below to authorize HubSpot access for ${clientName}`}
          </div>
        </div>
      </div>

      {!connected && (
        <>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
            Clicking "Connect" will redirect to HubSpot where you (or your client) can authorize access to their portal.
            Scopes requested: <strong>contacts, deals, content, CRM read</strong>.
          </div>
          <button onClick={handleConnect} disabled={loading}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: loading ? "#aaa" : accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Redirecting…" : "Connect HubSpot Portal →"}
          </button>
        </>
      )}

      {connected && (
        <div style={{ padding: "10px 14px", background: "#f0faf4", border: "1px solid #a8e6c0", borderRadius: 8, fontSize: 12, color: "#1D6A3A" }}>
          Portal connected and syncing. Tokens are encrypted and stored securely. To reconnect, click the button below.
          <br />
          <button onClick={handleConnect} disabled={loading}
            style={{ marginTop: 10, padding: "6px 14px", borderRadius: 8, border: "1px solid #1D6A3A", background: "transparent", color: "#1D6A3A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Reconnect / Reauthorize
          </button>
        </div>
      )}
    </div>
  );
}
