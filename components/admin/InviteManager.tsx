"use client";
import { useState, useEffect } from "react";

interface Invite { id: string; email: string; notes: string | null; createdAt: string; invitedBy: string | null; }

export function InviteManager({ accent }: { accent: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/invites").then(r => r.json()).then(d => setInvites(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setError("");
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), notes: notes.trim() || null }),
    });
    if (res.ok) {
      const invite = await res.json();
      setInvites(prev => [...prev, invite]);
      setEmail("");
      setNotes("");
      setAdding(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to add invite");
    }
  };

  const handleRemove = async (id: string) => {
    const res = await fetch("/api/invites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setInvites(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Allowed Users</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Only users on this list can log in via HubSpot OAuth</div>
        </div>
        <button onClick={() => setAdding(a => !a)}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, background: adding ? accent : "transparent", color: adding ? "#fff" : accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {adding ? "✕ Cancel" : "+ Add User"}
        </button>
      </div>

      {adding && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", background: accent + "06", display: "flex", flexDirection: "column", gap: 10 }}>
          {error && <div style={{ padding: "8px 12px", background: "#fff0f0", border: "1px solid #f5a0a0", borderRadius: 8, color: "#C0392B", fontSize: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="user@example.com"
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }} />
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }} />
            <button onClick={handleAdd}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Add
            </button>
          </div>
        </div>
      )}

      {loading && <div style={{ padding: 30, textAlign: "center", color: "#aaa" }}>Loading…</div>}

      {!loading && invites.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#bbb", fontSize: 13 }}>No allowed users yet. Add users to grant access.</div>
      )}

      {invites.map((inv, i) => (
        <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < invites.length - 1 ? "1px solid #f5f5f5" : "none" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{inv.email}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
              Added {new Date(inv.createdAt).toLocaleDateString()}
              {inv.notes && ` · ${inv.notes}`}
            </div>
          </div>
          <button onClick={() => handleRemove(inv.id)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #eee", background: "#fff", color: "#C0392B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
