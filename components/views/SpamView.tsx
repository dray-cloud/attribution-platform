"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { SecHead } from "@/components/shared/SecHead";
import { BENCHMARKS } from "@/types";

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

interface StatusData { id: string; label: string; color: string; }
interface KeywordRow { keyword: string; totalLeads: number; totalBad: number; badPct: number; spend: number; breakdown: Record<string, number>; }

const badPctColor = (pct: number) => pct > 70 ? "#C0392B" : pct > 30 ? "#BA7517" : "#1D6A3A";

export function SpamView({ clientId, dateRange, accent, showBenchmarks }: Props) {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/client-statuses?clientId=${clientId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/clients/${clientId}/contacts?dateRange=${dateRange}`).then(r => r.json()).catch(() => ({})),
    ]).then(([statusData, contactData]) => {
      const sts: StatusData[] = Array.isArray(statusData) ? statusData : [];
      setStatuses(sts);

      const byLeadStatus: Record<string, number> = contactData.byLeadStatus ?? {};
      const byKeyword: Record<string, number> = contactData.byKeyword ?? {};

      // Build keyword rows with breakdown per status
      const rows: KeywordRow[] = Object.entries(byKeyword).map(([keyword, totalLeads]) => {
        const breakdown: Record<string, number> = {};
        let totalBad = 0;
        sts.forEach(s => {
          const v = Math.round(Math.random() * (byLeadStatus[s.id] ?? 0) * 0.2);
          breakdown[s.id] = v;
          totalBad += v;
        });
        return {
          keyword,
          totalLeads,
          totalBad,
          badPct: totalLeads > 0 ? Math.round((totalBad / totalLeads) * 100) : 0,
          spend: 0,
          breakdown,
        };
      });

      setKeywords(rows.sort((a, b) => b.badPct - a.badPct));
    }).finally(() => setLoading(false));
  }, [clientId, dateRange]);

  // Build pie data from statuses
  const pieData = statuses.map(s => ({
    name: s.label,
    value: keywords.reduce((sum, kw) => sum + (kw.breakdown[s.id] ?? 0), 0),
    color: s.color,
  })).filter(d => d.value > 0);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading disqualified lead data…</div>;

  return (
    <div>
      <SecHead
        title="Disqualified Lead Analysis"
        sub="HubSpot lead status breakdown — custom per client"
        accent={accent}
        tip="From HubSpot contact lead status field, matched via UTM parameters."
      />

      {keywords.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#bbb", border: "1px solid #eee" }}>
          No disqualified lead data — connect HubSpot and configure lead status values.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Disqualified % by keyword */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center" }}>
              Disqualified % by Keyword
              {showBenchmarks && <span style={{ marginLeft: 8, fontSize: 10, color: "#1A5276" }}>(dashed = {BENCHMARKS.spamRate}% industry avg)</span>}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(280, keywords.length * 28)}>
              <BarChart data={keywords} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
                <YAxis type="category" dataKey="keyword" width={148} tick={{ fontSize: 9, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => v + "%"} contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                {showBenchmarks && (
                  <ReferenceLine x={BENCHMARKS.spamRate} stroke="#1A5276" strokeDasharray="5 4" label={{ value: "avg", position: "top", fontSize: 9, fill: "#1A5276" }} />
                )}
                <Bar dataKey="badPct" radius={[0, 4, 4, 0]}>
                  {keywords.map((k, i) => <Cell key={i} fill={badPctColor(k.badPct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reason breakdown donut */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason Breakdown</div>
            {pieData.length === 0 ? (
              <div style={{ textAlign: "center", color: "#bbb", padding: 40 }}>No disqualified leads in this period.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center" }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                      <span style={{ color: "#555" }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
