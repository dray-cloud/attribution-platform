"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AnnotationLayer } from "@/components/panels/AnnotationLayer";
import { PeriodNote } from "@/components/panels/PeriodNote";
import { SecHead } from "@/components/shared/SecHead";
import { Badge } from "@/components/shared/Badge";
import { fmt, fmtN, pct } from "@/lib/utils/formatters";
import { BENCHMARKS } from "@/types";
import type { ClientSpend } from "@/types";

interface MonthPoint { month: string; leads: number; revenue: number; spend: number; }

interface Props {
  clientId: string;
  dateRange: string;
  compare: string;
  accent: string;
  showBenchmarks: boolean;
  viewMode: string;
  setViewMode: (v: string) => void;
  attrModel: string;
  pageFilter: string;
  setPageFilter: (v: string) => void;
  setAttrModel: (v: string) => void;
  spend: ClientSpend;
  periodKey: string;
}

interface PageRow { name: string; type: string; visits: number; leads: number; value: number; }

export function DashboardView({ clientId, dateRange, accent, showBenchmarks, spend, periodKey }: Props) {
  const [monthly, setMonthly] = useState<MonthPoint[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [contacts, setContacts] = useState<Record<string, number>>({});
  const [deals, setDeals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/clients/${clientId}/contacts?dateRange=${dateRange}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/clients/${clientId}/deals?dateRange=${dateRange}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/clients/${clientId}/pages?dateRange=${dateRange}&attrModel=linear&pageFilter=all`).then(r => r.json()).catch(() => []),
    ]).then(([c, d, p]) => {
      setContacts({ leads: c.total ?? 0, sqls: c.sqls ?? 0 });
      setDeals({ deals: d.total ?? 0, closed: d.closed ?? 0, revenue: d.revenue ?? 0 });

      // Build monthly chart data by merging byMonth maps
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthlySpendPerMonth = (spend.services + spend.hubspot + spend.ads) / 12;
      const pts: MonthPoint[] = months.map(m => ({
        month: m,
        leads: (c.byMonth ?? {})[m] ?? 0,
        revenue: (d.byMonth ?? {})[m] ?? 0,
        spend: Math.round(monthlySpendPerMonth),
      }));
      setMonthly(pts);
      setPages(Array.isArray(p) ? p : []);
    }).finally(() => setLoading(false));
  }, [clientId, dateRange, spend]);

  const totalLeads = contacts.leads ?? 0;
  const totalSQL = contacts.sqls ?? 0;
  const totalDeals = deals.deals ?? 0;
  const totalClosed = deals.closed ?? 0;
  const totalRevenue = deals.revenue ?? 0;
  const totalSpend = spend.services + spend.hubspot + spend.ads;

  const funnelSteps = [
    { label: "Total Leads", val: totalLeads, pctOf: null as number | null, bench: null as number | null },
    { label: "SQLs", val: totalSQL, pctOf: totalLeads, bench: BENCHMARKS.sqlRate },
    { label: "Deals", val: totalDeals, pctOf: totalSQL, bench: null },
    { label: "Closed Won", val: totalClosed, pctOf: totalDeals, bench: BENCHMARKS.closeRate },
  ];

  const topPages = [...pages].sort((a, b) => b.leads - a.leads).slice(0, 5);

  const typeColor = (t: string) =>
    t === "blog" ? "#1A5276" : t === "service" ? "#1D6A3A" : t === "landing" ? "#C0392B" : "#888";

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading dashboard…</div>;

  return (
    <div>
      <PeriodNote clientId={clientId} dateRange={dateRange} accent={accent} />
      <AnnotationLayer clientId={clientId} dateRange={dateRange} accent={accent} />

      <SecHead title="Performance Overview" sub={`${dateRange} · month-by-month`} accent={accent} tip="Revenue from HubSpot Deals API by month." />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 20 }}>
        {/* Revenue & Spend chart */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue & Spend by Month</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v: number, n: string) => [fmt(v), n]} contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              {showBenchmarks && <ReferenceLine y={BENCHMARKS.roi * 100} stroke="#1A5276" strokeDasharray="6 3" label={{ value: "Ind. avg", position: "right", fontSize: 9, fill: "#1A5276" }} />}
              <Area type="monotone" dataKey="revenue" stroke={accent} fill={accent + "22"} strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="spend" stroke="#aaa" fill="#aaa22" strokeWidth={1.5} strokeDasharray="4 4" name="Spend" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Month */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Leads by Month</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Bar dataKey="leads" fill={accent} radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee", marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Lead → Deal Pipeline Funnel
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          {funnelSteps.map((s, i, arr) => {
            const barH = 28 + (totalLeads > 0 ? (s.val / totalLeads) * 64 : 0);
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{fmtN(s.val)}</div>
                  <div style={{ width: 76, height: barH, background: accent, opacity: 1 - i * 0.18, borderRadius: "6px 6px 0 0" }} />
                  <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>{s.label}</div>
                  {s.pctOf != null && <div style={{ fontSize: 10, color: accent, fontWeight: 600 }}>{pct(s.val, s.pctOf)} conv.</div>}
                  {showBenchmarks && s.bench != null && <div style={{ fontSize: 9, color: "#1A5276" }}>(avg {s.bench}%)</div>}
                </div>
                {i < arr.length - 1 && <div style={{ color: "#ccc", fontSize: 16, marginBottom: 36 }}>→</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Pages */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #eee" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Converting Pages</div>
        {topPages.length === 0 && <div style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: 20 }}>No page data yet — connect HubSpot to see attribution.</div>}
        {topPages.map((p, i) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < topPages.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: accent }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
              <Badge color={typeColor(p.type)}>{p.type}</Badge>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtN(p.leads)} leads</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{fmt(p.value)} attributed</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
