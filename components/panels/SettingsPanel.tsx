"use client";
import { useState, useEffect } from "react";
import type { ClientRecord, ClientSpend, ServiceArea, ClientStatus, AlertRule } from "@/types";
import { ALL_KPI_DEFS } from "@/types";

interface Props {
  client: ClientRecord;
  accent: string;
  spend: ClientSpend;
  onSpendChange: (spend: ClientSpend) => void;
  visibleKpis: string[];
  onKpisChange: (kpis: string[]) => void;
}

const ALL_ZIPS = [
  { zip: "29401", city: "Charleston" }, { zip: "29403", city: "Charleston" },
  { zip: "29412", city: "James Island" }, { zip: "29414", city: "West Ashley" },
  { zip: "29418", city: "N Charleston" }, { zip: "29420", city: "N Charleston" },
  { zip: "29445", city: "Goose Creek" }, { zip: "29464", city: "Mt Pleasant" },
  { zip: "29466", city: "Mt Pleasant" }, { zip: "29483", city: "Summerville" },
  { zip: "29485", city: "Summerville" }, { zip: "29455", city: "Johns Island" },
];

export function SettingsPanel({ client, accent, spend, onSpendChange, visibleKpis, onKpisChange }: Props) {
  const [tab, setTab] = useState<"spend" | "servicearea" | "statuses" | "alerts">("spend");
  const [serviceArea, setServiceArea] = useState<ServiceArea>({ mode: "radius", address: "", radiusMiles: 25, zips: [], counties: [] });
  const [statuses, setStatuses] = useState<ClientStatus[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const totalSpend = spend.services + spend.hubspot + spend.ads;

  useEffect(() => {
    fetch(`/api/service-areas?clientId=${client.id}`).then((r) => r.json()).then(setServiceArea).catch(() => {});
    fetch(`/api/client-statuses?clientId=${client.id}`).then((r) => r.json()).then(setStatuses).catch(() => {});
    fetch("/api/alert-rules").then((r) => r.json()).then(setAlerts).catch(() => {});
  }, [client.id]);

  const saveServiceArea = async (sa: ServiceArea) => {
    setServiceArea(sa);
    await fetch("/api/service-areas", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: client.id, ...sa }) });
  };

  const saveSpend = async (s: ClientSpend) => {
    onSpendChange(s);
    await fetch("/api/spend", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: client.id, ...s }) });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", marginBottom: 20, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
        {[["spend", "Spend & KPIs"], ["servicearea", "Service Area"], ["statuses", "Lead Statuses"], ["alerts", "Alert Config"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)}
            style={{
              padding: "12px 18px", border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: tab === k ? 700 : 400, color: tab === k ? accent : "#888",
              background: "transparent", borderBottom: tab === k ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -1,
            }}
          >{l}</button>
        ))}
      </div>

      {tab === "spend" && (
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Monthly Spend Inputs</div>
            {([["services", "Marketing Services"], ["hubspot", "HubSpot Cost"], ["ads", "Ad Spend"]] as const).map(([k, l]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 6 }}>{l}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#888" }}>$</span>
                  <input type="number" value={spend[k]}
                    onChange={(e) => saveSpend({ ...spend, [k]: +e.target.value })}
                    style={{ width: 120, padding: "6px 10px", border: "1px solid #eee", borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "10px 14px", background: accent + "12", borderRadius: 8, fontSize: 13, fontWeight: 700, color: accent }}>
              Total: ${totalSpend.toLocaleString()}/mo
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Summary Bar KPIs</div>
            {ALL_KPI_DEFS.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input type="checkbox" checked={visibleKpis.includes(k.id)}
                  onChange={(e) => onKpisChange(e.target.checked ? [...visibleKpis, k.id] : visibleKpis.filter((x) => x !== k.id))}
                  style={{ accentColor: accent }} />
                <span style={{ fontSize: 13, color: "#444" }}>{k.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "servicearea" && (
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Coverage Type</div>
              <div style={{ display: "inline-flex", background: "#f5f5f5", borderRadius: 9, padding: 3, gap: 2, marginBottom: 16 }}>
                {(["radius", "zips", "county"] as const).map((m) => (
                  <button key={m} onClick={() => saveServiceArea({ ...serviceArea, mode: m })}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: serviceArea.mode === m ? accent : "transparent", color: serviceArea.mode === m ? "#fff" : "#888" }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Business Address</div>
                <input value={serviceArea.address} onChange={(e) => saveServiceArea({ ...serviceArea, address: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #eee", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>Served Zip Codes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_ZIPS.map((z) => {
                  const active = serviceArea.zips.includes(z.zip);
                  return (
                    <button key={z.zip}
                      onClick={() => saveServiceArea({ ...serviceArea, zips: active ? serviceArea.zips.filter((x) => x !== z.zip) : [...serviceArea.zips, z.zip] })}
                      style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${active ? accent : "#e0e0e0"}`, cursor: "pointer", fontSize: 11, fontWeight: 600, background: active ? accent : "#fff", color: active ? "#fff" : "#777" }}
                    >{z.zip}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "statuses" && (
        <div style={{ padding: 22 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 14, lineHeight: 1.6 }}>
            Disqualify reasons for <strong>{client.name}</strong> — synced from HubSpot lead status field.
          </div>
          {statuses.length === 0 ? (
            <div style={{ fontSize: 12, color: "#aaa" }}>No custom statuses configured. Connect the HubSpot portal to sync lead statuses.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {statuses.map((s) => (
                <div key={s.id} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${s.color}30`, background: s.color + "0d", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div style={{ padding: 22 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>Configure alert thresholds for <strong>{client.name}</strong>.</div>
          {alerts.map((a) => (
            <div key={a.id} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #eee", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, background: a.active ? "#fff" : "#fafafa" }}>
              <div onClick={async () => {
                  const next = { ...a, active: !a.active };
                  setAlerts((prev) => prev.map((x) => x.id === a.id ? next : x));
                  await fetch("/api/alert-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, active: !a.active }) });
                }}
                style={{ width: 34, height: 20, borderRadius: 10, background: a.active ? accent : "#ddd", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 3, left: a.active ? 16 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.active ? "#1a1a1a" : "#aaa" }}>{a.label}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  {(["inapp", "email"] as const).map((d) => (
                    <label key={d} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: "#888" }}>
                      <input type="checkbox" checked={a.delivery.includes(d)}
                        onChange={async (e) => {
                          const next = e.target.checked ? [...a.delivery, d] : a.delivery.filter((v) => v !== d);
                          setAlerts((prev) => prev.map((x) => x.id === a.id ? { ...x, delivery: next } : x));
                          await fetch("/api/alert-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, delivery: next }) });
                        }}
                        style={{ accentColor: accent }} />
                      {d === "inapp" ? "In-app" : "Email"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
