"use client";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientRecord, NavView } from "@/types";

const NAV_ITEMS: { id: NavView; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "attribution", label: "Attribution" },
  { id: "roi", label: "ROI & ROAS" },
  { id: "heatmap", label: "Lead Map" },
  { id: "journeymap", label: "Journey Map" },
  { id: "paths", label: "Journeys" },
  { id: "cta", label: "CTAs" },
  { id: "adanalysis", label: "Ad Analysis" },
  { id: "spam", label: "Spam Analysis" },
];

interface SidebarProps {
  clients: ClientRecord[];
  activeClient: ClientRecord;
  nav: NavView;
  onNavChange: (n: NavView) => void;
  showSettings: boolean;
  onSettingsToggle: () => void;
}

export function Sidebar({
  clients,
  activeClient,
  nav,
  onNavChange,
  showSettings,
  onSettingsToggle,
}: SidebarProps) {
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const accent = activeClient.primaryColor;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: 218,
      background: "#fff", borderRight: "1px solid #ebebeb",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* Client dropdown */}
      <div style={{ padding: "16px 12px 12px", borderBottom: "1px solid #f0f0f0", position: "relative" }} ref={dropRef}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.08em", marginBottom: 7, textTransform: "uppercase" }}>
          Active Client
        </div>
        <div
          onClick={() => setDropOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            borderRadius: 10, border: "1px solid #eee", cursor: "pointer", background: "#fafafa",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>{activeClient.logoInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeClient.name}
            </div>
            <div style={{ fontSize: 10, color: "#aaa" }}>{activeClient.industry}</div>
          </div>
          <span style={{ fontSize: 10, color: "#bbb" }}>{dropOpen ? "▲" : "▼"}</span>
        </div>

        {dropOpen && (
          <div style={{
            position: "absolute", left: 12, right: 12, top: "calc(100% + 2px)",
            background: "#fff", borderRadius: 10, border: "1px solid #eee",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden",
          }}>
            <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Switch client
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {clients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { router.push(`/dashboard/${c.id}`); setDropOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    cursor: "pointer", background: activeClient.id === c.id ? c.primaryColor + "12" : "transparent",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, background: c.primaryColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8.5, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>{c.logoInitials}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: activeClient.id === c.id ? c.primaryColor : "#333" }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{c.industry}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map((n) => (
          <div
            key={n.id}
            onClick={() => onNavChange(n.id)}
            style={{
              padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
              fontSize: 13, fontWeight: nav === n.id ? 600 : 400,
              background: nav === n.id ? accent + "18" : "transparent",
              color: nav === n.id ? accent : "#555",
              borderLeft: nav === n.id ? `3px solid ${accent}` : "3px solid transparent",
              transition: "all 0.15s",
            }}
          >{n.label}</div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
        <div
          onClick={onSettingsToggle}
          style={{
            padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
            color: showSettings ? accent : "#888", fontWeight: showSettings ? 600 : 400,
            background: showSettings ? accent + "12" : "transparent",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >⚙ Settings</div>
      </div>
    </div>
  );
}
