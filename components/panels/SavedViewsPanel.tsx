"use client";
import { useState, useEffect } from "react";
import type { SavedView, DateRange, AttrModel, PageFilter, NavView, CompareMode } from "@/types";

interface Props {
  clientId: string;
  accent: string;
  currentState: {
    clientId: string; dateRange: DateRange; attrModel: AttrModel;
    pageFilter: PageFilter; nav: NavView; comparePeriod: CompareMode;
  };
  onLoad: (v: SavedView) => void;
}

export function SavedViewsPanel({ clientId, accent, currentState, onLoad }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/saved-views")
      .then((r) => r.json())
      .then((d) => setViews(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    const res = await fetch("/api/saved-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), ...currentState }),
    });
    const { id } = await res.json();
    const newView: SavedView = { id, name: name.trim(), ...currentState, created: new Date().toLocaleDateString() };
    setViews((prev) => [newView, ...prev]);
    setName(""); setSaving(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/saved-views?id=${id}`, { method: "DELETE" });
    setViews((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>⭐ Saved Views</span>
        <button onClick={() => setSaving((s) => !s)}
          style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${accent}`, background: saving ? accent : "transparent", color: saving ? "#fff" : accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "✕ Cancel" : "+ Save Current"}
        </button>
      </div>

      {saving && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: accent + "06", display: "flex", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="View name (e.g. MTD Blog Performance)"
            style={{ flex: 1, padding: "7px 11px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, outline: "none" }} />
          <button onClick={save} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
        </div>
      )}

      {views.length === 0 && (
        <div style={{ padding: "14px 16px", fontSize: 12, color: "#bbb", textAlign: "center" }}>No saved views yet. Configure filters and click "Save Current".</div>
      )}

      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {views.map((v) => (
          <div key={v.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{v.name}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{v.dateRange} · {v.attrModel} · {v.pageFilter} · {v.nav}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onLoad(v)} style={{ padding: "4px 11px", borderRadius: 7, border: `1px solid ${accent}`, background: "transparent", color: accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Load</button>
              <button onClick={() => remove(v.id)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid #eee", background: "#fff", color: "#ccc", fontSize: 11, cursor: "pointer" }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
