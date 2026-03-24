"use client";
import { useState, useEffect } from "react";
import { Tip } from "@/components/shared/Tip";

interface Props {
  clientId: string;
  periodKey: string;
  dateRange: string;
  accent: string;
}

export function PeriodNote({ clientId, periodKey, dateRange }: Props) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch(`/api/period-notes?clientId=${clientId}&periodKey=${encodeURIComponent(periodKey)}`)
      .then((r) => r.json())
      .then((d) => { setText(d.text ?? ""); setSaved(d.saved); setEditing(false); })
      .catch(() => {});
  }, [clientId, periodKey]);

  const save = async () => {
    const res = await fetch("/api/period-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, periodKey, text: draft }),
    });
    const d = await res.json();
    setText(draft);
    setSaved(d.saved);
    setEditing(false);
  };

  return (
    <div style={{
      background: "#FAEEDA22", border: "1px solid #BA751730",
      borderRadius: 12, padding: "14px 18px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#BA7517", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            📓 Period Note — {dateRange}
          </span>
          <Tip text="This note is locked to the current date range and client. Switch periods to write separate notes for each." />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && !editing && <span style={{ fontSize: 10, color: "#BA7517", opacity: 0.7 }}>Saved {saved}</span>}
          {editing ? (
            <>
              <button onClick={save} style={{ padding: "4px 12px", borderRadius: 7, border: "none", background: "#BA7517", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
              <button onClick={() => { setDraft(text); setEditing(false); }} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #ddd", background: "#fff", color: "#888", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => { setDraft(text); setEditing(true); }} style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid #BA751750", background: "transparent", color: "#BA7517", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {text ? "✏ Edit" : "+ Add Note"}
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Write a note for the ${dateRange} period…`}
          style={{ width: "100%", minHeight: 70, padding: "9px 12px", borderRadius: 8, border: "1px solid #BA751740", fontSize: 13, lineHeight: 1.6, color: "#333", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", background: "#fff", outline: "none" }}
        />
      ) : (
        <div style={{ fontSize: 13, color: text ? "#444" : "#BA751780", lineHeight: 1.7, fontStyle: text ? "normal" : "italic" }}>
          {text || `No note for ${dateRange} yet. Click "+ Add Note" to write one.`}
        </div>
      )}
    </div>
  );
}
