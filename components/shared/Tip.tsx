"use client";
import { useState } from "react";

export function Tip({ text }: { text: string }) {
  const [on, setOn] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 14, height: 14, borderRadius: "50%", background: "#e8e8e8",
          color: "#888", fontSize: 9, fontWeight: 700, cursor: "help",
          marginLeft: 5, userSelect: "none",
        }}
      >?</span>
      {on && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff",
          fontSize: 11, lineHeight: 1.5, padding: "8px 11px", borderRadius: 8,
          width: 230, zIndex: 9999, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>{text}</span>
      )}
    </span>
  );
}
