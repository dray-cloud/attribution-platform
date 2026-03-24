"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SecHead } from "@/components/shared/SecHead";
import { VToggle } from "@/components/shared/VToggle";
import { fmtN } from "@/lib/utils/formatters";

interface Props {
  clientId: string;
  dateRange: string;
  accent: string;
  showBenchmarks: boolean;
  viewMode: string;
  setViewMode: (v: string) => void;
  attrModel: string;
  pageFilter: string;
  setPageFilter: (v: string) => void;
  setAttrModel: (v: string) => void;
  compare: string;
  spend: { services: number; hubspot: number; ads: number };
}

interface CtaRow { name: string; page: string; clicks: number; conversions: number; rate: number; }

export function CtaView({ clientId, dateRange, accent, viewMode, setViewMode }: Props) {
  const [ctas, setCtas] = useState<CtaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/ctas?dateRange=${dateRange}`)
      .then(r => r.json())
      .then(d => setCtas(Array.isArray(d) ? d : []))
      .catch(() => setCtas([]))
      .finally(() => setLoading(false));
  }, [clientId, dateRange]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading CTA data…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <SecHead title="CTA Performance" sub="Click-through and conversion rates per call-to-action" accent={accent} tip="From HubSpot CTA Analytics API." />
        <VToggle view={viewMode} setView={setViewMode} accent={accent} />
      </div>

      {ctas.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#bbb", border: "1px solid #eee" }}>
          No CTA data — connect HubSpot to see performance.
        </div>
      )}

      {ctas.length > 0 && viewMode === "Charts" && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ctas}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Bar dataKey="clicks" fill={accent + "88"} radius={[4, 4, 0, 0]} name="Clicks" />
              <Bar dataKey="conversions" fill={accent} radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {ctas.length > 0 && viewMode === "Table" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["CTA", "Page", "Clicks", "Conversions", "Conv. Rate"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", borderBottom: "1px solid #eee", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ctas.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "11px 16px", color: "#555" }}>{c.page}</td>
                  <td style={{ padding: "11px 16px" }}>{fmtN(c.clicks)}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{fmtN(c.conversions)}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 2, maxWidth: 80 }}>
                        <div style={{ width: Math.min(100, c.rate) + "%", height: "100%", background: accent, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontWeight: 700, color: accent }}>{c.rate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
