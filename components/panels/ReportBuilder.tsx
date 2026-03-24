"use client";
import { useState, useEffect } from "react";
import { REPORT_SECTIONS } from "@/types";

interface Props {
  clientId: string;
  clientName: string;
  accent: string;
  dateRange: string;
  onExportPDF: (sections: string[]) => void;
}

export function ReportBuilder({ clientId, clientName, accent, dateRange, onExportPDF }: Props) {
  const [layout, setLayout] = useState<string[]>(REPORT_SECTIONS.map((s) => s.id));
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/report-layouts?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => { if (d.sections?.length) setLayout(d.sections); })
      .catch(() => {});
  }, [clientId]);

  const saveLayout = async (sections: string[]) => {
    setLayout(sections);
    await fetch("/api/report-layouts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, sections }),
    });
  };

  const included = layout.filter((id) => REPORT_SECTIONS.find((s) => s.id === id));
  const excluded = REPORT_SECTIONS.filter((s) => !layout.includes(s.id));

  const reorder = (from: number, to: number) => {
    const next = [...included];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    saveLayout(next);
  };

  const toggle = (id: string) => {
    if (included.includes(id)) saveLayout(included.filter((x) => x !== id));
    else saveLayout([...included, id]);
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>Drag to reorder · toggle to include/exclude from PDF export</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1D6A3A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✓ Included ({included.length})</div>
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden", background: "#fafafa" }}>
            {included.map((id, i) => {
              const sec = REPORT_SECTIONS.find((s) => s.id === id);
              if (!sec) return null;
              return (
                <div key={id}
                  draggable
                  onDragStart={() => setDragging(i)}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                  onDrop={() => { if (dragging !== null && dragging !== i) reorder(dragging, i); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                    borderBottom: i < included.length - 1 ? "1px solid #eee" : "none",
                    background: dragOver === i ? "#e8f4ed" : "#fff", cursor: "grab",
                    userSelect: "none", transition: "background 0.1s",
                  }}
                >
                  <span style={{ color: "#ccc", fontSize: 14 }}>⠿</span>
                  <span style={{ fontSize: 14, color: accent }}>{sec.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#333", flex: 1 }}>{sec.label}</span>
                  <span style={{ fontSize: 11, color: "#aaa", background: "#f0f0f0", padding: "1px 6px", borderRadius: 10 }}>{i + 1}</span>
                  <button onClick={() => toggle(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 13, padding: 0 }}>×</button>
                </div>
              );
            })}
            {included.length === 0 && <div style={{ padding: 14, fontSize: 12, color: "#ccc", textAlign: "center" }}>No sections selected</div>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C0392B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>✗ Not included ({excluded.length})</div>
          <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
            {excluded.map((sec, i) => (
              <div key={sec.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: i < excluded.length - 1 ? "1px solid #eee" : "none", background: "#fafafa" }}>
                <span style={{ fontSize: 14, color: "#ccc" }}>{sec.icon}</span>
                <span style={{ fontSize: 12, color: "#aaa", flex: 1 }}>{sec.label}</span>
                <button onClick={() => toggle(sec.id)} style={{ padding: "3px 10px", borderRadius: 7, border: "1px solid #eee", background: "#fff", color: "#555", fontSize: 11, cursor: "pointer" }}>+ Add</button>
              </div>
            ))}
            {excluded.length === 0 && <div style={{ padding: 14, fontSize: 12, color: "#ccc", textAlign: "center" }}>All sections included</div>}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={() => saveLayout(REPORT_SECTIONS.map((s) => s.id))}
          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#888", fontSize: 12, cursor: "pointer" }}
        >Reset to all</button>
        <button
          onClick={() => onExportPDF(included)}
          style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >⬇ Export PDF with this layout</button>
      </div>
    </div>
  );
}
