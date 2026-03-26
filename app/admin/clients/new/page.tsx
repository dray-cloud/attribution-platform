"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT_COLORS = [
  "#6C3483", "#C0392B", "#1D6A3A", "#1A5276", "#BA7517",
  "#1F618D", "#212F3C", "#CB4335", "#2E86C1", "#117A65",
];

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    logoInitials: "",
    primaryColor: "#6C3483",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.logoInitials) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const client = await res.json();
      router.push(`/admin/clients/${client.id}`);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Failed to create client");
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, hint?: string) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>{hint}</div>}
      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: 9, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Add New Client</h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Create a client record, then connect their HubSpot portal.</p>
      </div>

      <div style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "28px 32px" }}>
          {error && <div style={{ padding: "10px 14px", background: "#fff0f0", border: "1px solid #f5a0a0", borderRadius: 8, color: "#C0392B", fontSize: 12, marginBottom: 18 }}>{error}</div>}

          {field("name", "Client Name *", "e.g. Adkins Roofing")}
          {field("industry", "Industry", "e.g. Roofing & Restoration")}
          {field("logoInitials", "Logo Initials *", "e.g. AR", "2-3 characters shown in the sidebar avatar")}

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 8 }}>Brand Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {ACCENT_COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, primaryColor: c }))}
                  style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: "pointer", border: form.primaryColor === c ? "3px solid #1a1a1a" : "3px solid transparent", transition: "border 0.1s" }} />
              ))}
              <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #eee", cursor: "pointer", padding: 0 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: form.primaryColor, border: "1px solid #eee", flexShrink: 0 }} />
              <input
                value={form.primaryColor}
                onChange={e => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setForm(f => ({ ...f, primaryColor: val }));
                }}
                onBlur={e => {
                  if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setForm(f => ({ ...f, primaryColor: "#6C3483" }));
                }}
                placeholder="#6C3483"
                maxLength={7}
                style={{ width: 100, padding: "6px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, fontFamily: "monospace", outline: "none" }}
              />
              <span style={{ fontSize: 11, color: "#aaa" }}>Enter any hex code</span>
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #eee", marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: form.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
              {form.logoInitials || "?"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{form.name || "Client Name"}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{form.industry || "Industry"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => router.back()}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #eee", background: "#fff", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.name || !form.logoInitials}
              style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: loading ? "#aaa" : form.primaryColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Creating…" : "Create Client →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
