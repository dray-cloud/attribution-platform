"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SecHead } from "@/components/shared/SecHead";
import { Badge } from "@/components/shared/Badge";
import { VToggle } from "@/components/shared/VToggle";
import { fmt, fmtN, pct } from "@/lib/utils/formatters";

interface Props {
  clientId: string;
  dateRange: string;
  accent: string;
  showBenchmarks: boolean;
  viewMode: string;
  setViewMode: (v: string) => void;
  attrModel: string;
  setAttrModel: (v: string) => void;
  pageFilter: string;
  setPageFilter: (v: string) => void;
  compare: string;
  spend: { services: number; hubspot: number; ads: number };
}

interface PageRow { name: string; type: string; visits: number; leads: number; value: number; }

const typeColor = (t: string) =>
  t === "blog" ? "#1A5276" : t === "service" ? "#1D6A3A" : t === "landing" ? "#C0392B" : "#888";

export function AttributionView({ clientId, dateRange, accent, viewMode, setViewMode, attrModel, setAttrModel, pageFilter, setPageFilter }: Props) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/pages?dateRange=${dateRange}&attrModel=${attrModel}&pageFilter=${pageFilter}`)
      .then(r => r.json())
      .then(d => setPages(Array.isArray(d) ? d : []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [clientId, dateRange, attrModel, pageFilter]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <SecHead
          title="Page Attribution"
          sub="Value distributed across touchpoints"
          accent={accent}
          tip="Attribution value = closed deal amounts distributed across pages. Linear = equal; First = 100% first; Last = 100% last; Decay = more recent = more weight."
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={attrModel} onChange={e => setAttrModel(e.target.value)} style={{ fontSize: 12, border: "1px solid #eee", borderRadius: 8, padding: "7px 10px", color: "#555", background: "#fff" }}>
            <option value="linear">Linear (equal split)</option>
            <option value="first">First touch</option>
            <option value="last">Last touch</option>
            <option value="decay">Time decay</option>
          </select>
          <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 8, padding: 3, gap: 2 }}>
            {["all", "blog", "service", "landing", "other"].map(t => (
              <button key={t} onClick={() => setPageFilter(t)}
                style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, textTransform: "capitalize", background: pageFilter === t ? accent : "transparent", color: pageFilter === t ? "#fff" : "#888", transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
          <VToggle view={viewMode} setView={setViewMode} accent={accent} />
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Loading pages…</div>}

      {!loading && pages.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#bbb", border: "1px solid #eee" }}>
          No page data — connect HubSpot to see attribution.
        </div>
      )}

      {!loading && pages.length > 0 && viewMode === "Charts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {([["Leads by Page", "leads", false], ["Attributed Value", "value", true]] as const).map(([title, key, money]) => (
            <div key={title} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pages} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => money ? "$" + (v / 1000).toFixed(0) + "k" : String(v)} />
                  <YAxis type="category" dataKey="name" width={155} tick={{ fontSize: 9.5, fill: "#555" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => money ? fmt(v) : v} contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                  <Bar dataKey={key} fill={accent} radius={[0, 4, 4, 0]} name={title} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {!loading && pages.length > 0 && viewMode === "Table" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["Page", "Type", "Visits", "Leads", "Conv. Rate", "Attributed Value"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", borderBottom: "1px solid #eee", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={p.name} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1a1a1a" }}>{p.name}</td>
                  <td style={{ padding: "11px 16px" }}><Badge color={typeColor(p.type)}>{p.type}</Badge></td>
                  <td style={{ padding: "11px 16px", color: "#555" }}>{fmtN(p.visits)}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{fmtN(p.leads)}</td>
                  <td style={{ padding: "11px 16px", color: "#555" }}>{pct(p.leads, p.visits)}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: accent }}>{fmt(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
