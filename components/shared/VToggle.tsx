"use client";

interface VToggleProps {
  view: string;
  setView: (v: string) => void;
  accent: string;
}

export function VToggle({ view, setView, accent }: VToggleProps) {
  return (
    <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 8, padding: 3, gap: 2 }}>
      {["Charts", "Table"].map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: view === v ? accent : "transparent",
            color: view === v ? "#fff" : "#888",
            transition: "all 0.15s",
          }}
        >{v}</button>
      ))}
    </div>
  );
}
