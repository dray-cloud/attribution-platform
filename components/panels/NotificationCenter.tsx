"use client";
import { useState } from "react";
import { Badge } from "@/components/shared/Badge";
import type { NotificationItem, AlertRule } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id?: string) => void;
  alerts: AlertRule[];
  onAlertToggle: (id: string, active: boolean) => void;
  onAlertDelivery: (id: string, delivery: string[]) => void;
  accent: string;
}

export function NotificationCenter({
  open, onClose, notifications, onMarkRead, alerts,
  onAlertToggle, onAlertDelivery, accent,
}: Props) {
  const [tab, setTab] = useState<"inbox" | "rules">("inbox");
  const unread = notifications.filter((n) => !n.read).length;

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", top: 60, right: 20, width: 420, background: "#fff",
      borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      border: "1px solid #eee", zIndex: 500, overflow: "hidden",
    }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Notifications</span>
          {unread > 0 && <span style={{ background: accent, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 12 }}>{unread}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "inbox" && unread > 0 && (
            <button onClick={() => onMarkRead()} style={{ fontSize: 11, color: accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
        {(["inbox", "rules"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontSize: 12,
              fontWeight: tab === k ? 700 : 400, color: tab === k ? accent : "#888",
              background: "transparent", borderBottom: tab === k ? `2px solid ${accent}` : "2px solid transparent",
              marginBottom: -1,
            }}
          >{k === "inbox" ? "Alerts" : "Alert Rules"}</button>
        ))}
      </div>

      {tab === "inbox" && (
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {notifications.length === 0 && (
            <div style={{ padding: "24px", fontSize: 12, color: "#bbb", textAlign: "center" }}>No notifications yet.</div>
          )}
          {notifications.map((n) => (
            <div key={n.id} onClick={() => onMarkRead(n.id)}
              style={{ padding: "12px 18px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", background: n.read ? "#fff" : "#fafeff", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: n.read ? "transparent" : n.severity === "high" ? "#C0392B" : n.severity === "medium" ? "#BA7517" : "#1D6A3A" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: "#1a1a1a", lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, display: "flex", gap: 8 }}>
                  <span>{n.clientName}</span>·<span>{n.time}</span>
                  {!n.read && <Badge color={n.severity === "high" ? "#C0392B" : n.severity === "medium" ? "#BA7517" : "#1D6A3A"}>{n.severity}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "rules" && (
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "10px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>Configure thresholds · choose delivery per rule</div>
          {alerts.map((a) => (
            <div key={a.id} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #eee", marginBottom: 8, background: a.active ? "#fff" : "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: a.active ? "#1a1a1a" : "#aaa" }}>{a.label}</span>
                <div
                  onClick={() => onAlertToggle(a.id, !a.active)}
                  style={{ width: 32, height: 18, borderRadius: 9, background: a.active ? accent : "#ddd", position: "relative", cursor: "pointer", transition: "background 0.2s" }}
                >
                  <div style={{ position: "absolute", top: 2, left: a.active ? 14 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["inapp", "email"] as const).map((d) => (
                  <label key={d} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: "#888" }}>
                    <input type="checkbox" checked={a.delivery.includes(d)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...a.delivery, d] : a.delivery.filter((v) => v !== d);
                        onAlertDelivery(a.id, next);
                      }}
                      style={{ accentColor: accent }} />
                    {d === "inapp" ? "In-app" : "Email"}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
