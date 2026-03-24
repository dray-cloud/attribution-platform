"use client";
import { useState, useEffect } from "react";
import { Tip } from "@/components/shared/Tip";
import type { Annotation, AnnotationType } from "@/types";

const typeColors: Record<string, string> = {
  campaign: "#1A5276", content: "#1D6A3A", pause: "#C0392B", budget: "#BA7517", other: "#888",
};
const typeLabels: Record<string, string> = {
  campaign: "Campaign", content: "Content", pause: "Pause/Stop", budget: "Budget", other: "Other",
};

interface Props {
  clientId: string;
  periodKey: string;
  dateRange: string;
  accent: string;
}

export function AnnotationLayer({ clientId, periodKey, dateRange, accent }: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ month: "Jan", text: "", type: "campaign" as AnnotationType });

  useEffect(() => {
    fetch(`/api/annotations?clientId=${clientId}&periodKey=${encodeURIComponent(periodKey)}`)
      .then((r) => r.json())
      .then(setAnnotations)
      .catch(() => {});
  }, [clientId, periodKey]);

  const save = async () => {
    if (!form.text.trim()) return;
    const res = await fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, periodKey, ...form }),
    });
    const note = await res.json();
    setAnnotations((prev) => [...prev, note]);
    setForm({ month: "Jan", text: "", type: "campaign" });
    setAdding(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/annotations?id=${id}`, { method: "DELETE" });
    setAnnotations((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", marginBottom: 20, overflow: "hidden" }}>
      <div style={{
        padding: "13px 18px", borderBottom: "1px solid #f0f0f0", background: "#fafafa",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>📌 Chart Annotations</span>
          <Tip text="Notes pinned to specific months. They appear as reference lines on charts." />
          <span style={{ fontSize: 11, color: "#aaa" }}>— {dateRange} · {annotations.length} note{annotations.length !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${accent}`,
            background: adding ? accent : "transparent", color: adding ? "#fff" : accent,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >{adding ? "✕ Cancel" : "+ Add Note"}</button>
      </div>

      {adding && (
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid #f0f0f0",
          background: accent + "06", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Month</div>
            <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
              style={{ padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, background: "#fff" }}>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Type</div>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AnnotationType }))}
              style={{ padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, background: "#fff" }}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Note</div>
            <input
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="e.g. Launched spring campaign"
              style={{ width: "100%", padding: "7px 11px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <button onClick={save}
            style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Save
          </button>
        </div>
      )}

      {annotations.length === 0 && !adding && (
        <div style={{ padding: "16px 18px", fontSize: 12, color: "#bbb", textAlign: "center" }}>
          No annotations for this period — click "Add Note" to pin context to your charts.
        </div>
      )}

      {annotations.length > 0 && (
        <div style={{ padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {annotations.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
              borderRadius: 20, background: typeColors[n.type] + "14",
              border: `1px solid ${typeColors[n.type]}30`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColors[n.type], flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[n.type] }}>{n.month}</span>
              <span style={{ fontSize: 12, color: "#444" }}>{n.text}</span>
              <span style={{ fontSize: 10, color: "#bbb" }}>· {typeLabels[n.type]}</span>
              <button onClick={() => remove(n.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
