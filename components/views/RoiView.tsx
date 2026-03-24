"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SecHead } from "@/components/shared/SecHead";
import { fmt } from "@/lib/utils/formatters";
import { BENCHMARKS } from "@/types";
import type { ClientSpend } from "@/types";

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
  spend: ClientSpend;
}

interface MonthPoint { month: string; revenue: number; spend: number; roi: string; benchmark: number; }

export function RoiView({ clientId, dateRange, accent, showBenchmarks, spend }: Props) {
  const [monthly, setMonthly] = useState<MonthPoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const monthlySpend = (spend.services + spend.hubspot + spend.ads) / 12;
    Promise.all([
      fetch(`/api/clients/${clientId}/deals?dateRange=${dateRange}`).then(r => r.json()).catch(() => ({})),
    ]).then(([d]) => {
      setTotalRevenue(d.revenue ?? 0);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const byMonth: Record<string, number> = d.byMonth ?? {};
      setMonthly(months.map(m => {
        const rev = byMonth[m] ?? 0;
        const sp = Math.round(monthlySpend);
        const roi = sp > 0 ? (((rev - sp) / sp) * 100).toFixed(1) : "0";
        return { month: m, revenue: rev, spend: sp, roi, benchmark: BENCHMARKS.roi };
      }));
    }).finally(() => setLoading(false));
  }, [clientId, dateRange, spend]);

  const totalSpend = spend.services + spend.hubspot + spend.ads;
  const roi = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1) : "—";
  const roas = spend.ads > 0 ? (totalRevenue / spend.ads).toFixed(2) : "—";
  const cpl = 0; // Would need contact count

  const metrics = [
    { label: "Marketing ROI", value: roi === "—" ? "—" : roi + "%", sub: "(Revenue − Spend) / Spend", color: roi !== "—" && +roi > 0 ? "#1D6A3A" : "#C0392B", bench: `Industry avg: ${BENCHMARKS.roi}%` },
    { label: "ROAS", value: roas === "—" ? "—" : roas + "x", sub: "Revenue / Ad Spend", color: accent, bench: `Industry avg: ${BENCHMARKS.roas}x` },
    { label: "Ad Spend", value: fmt(spend.ads), sub: "Monthly ad budget", color: "#1a1a1a", bench: null },
  ];

  const spendSlices = [
    { name: "Marketing Services", value: spend.services },
    { name: "HubSpot", value: spend.hubspot },
    { name: "Ad Spend", value: spend.ads },
  ];
  const sliceColors = [accent, "#888", "#aaa"];

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading ROI data…</div>;

  return (
    <div>
      <SecHead title="ROI & ROAS" sub="Based on attributed revenue and manual spend inputs" accent={accent} tip="ROI = (Revenue − Spend) ÷ Spend × 100. ROAS = Revenue ÷ Ad Spend." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.sub}</div>
            {showBenchmarks && m.bench && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#1A5276", fontWeight: 600, borderTop: "1px dashed #eee", paddingTop: 6 }}>{m.bench}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Spend breakdown donut */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spend Breakdown</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={spendSlices} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
                {sliceColors.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={(v: number) => "$" + v.toLocaleString()} contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {spendSlices.map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sliceColors[i] }} />
                <span style={{ color: "#555" }}>{s.name}</span>
                <span style={{ fontWeight: 700 }}>${s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Trend */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>ROI Trend by Month</div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => v + "%"} />
              <Tooltip formatter={(v: string, n: string) => [v + "%", n]} contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Line type="monotone" dataKey="roi" stroke={accent} strokeWidth={2.5} dot={{ fill: accent, r: 3 }} name="Your ROI" />
              {showBenchmarks && (
                <Line type="monotone" dataKey="benchmark" stroke="#1A5276" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Industry avg" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
