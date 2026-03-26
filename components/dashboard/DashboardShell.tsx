"use client";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AnnotationLayer } from "@/components/panels/AnnotationLayer";
import { PeriodNote } from "@/components/panels/PeriodNote";
import { SavedViewsPanel } from "@/components/panels/SavedViewsPanel";
import { ReportBuilder } from "@/components/panels/ReportBuilder";
import { NotificationCenter } from "@/components/panels/NotificationCenter";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { DashboardView } from "@/components/views/DashboardView";
import { AttributionView } from "@/components/views/AttributionView";
import { RoiView } from "@/components/views/RoiView";
import { LeadMapView } from "@/components/views/LeadMapView";
import { JourneyMapView } from "@/components/views/JourneyMapView";
import { PathsView } from "@/components/views/PathsView";
import { CtaView } from "@/components/views/CtaView";
import { AdAnalysisView } from "@/components/views/AdAnalysisView";
import { SpamView } from "@/components/views/SpamView";
import { periodKeyForDate } from "@/lib/utils/date-ranges";
import { BENCHMARKS, DEFAULT_KPI_IDS } from "@/types";
import { fmt, fmtN } from "@/lib/utils/formatters";
import type {
  ClientRecord, DateRange, AttrModel, PageFilter, NavView, CompareMode,
  ClientSpend, NotificationItem, AlertRule, SavedView,
} from "@/types";

interface Props {
  clients: ClientRecord[];
  activeClient: ClientRecord;
  initialSpend: ClientSpend;
}

export default function DashboardShell({ clients, activeClient, initialSpend }: Props) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [nav, setNav] = useState<NavView>("dashboard");
  const [dateRange, setDateRange] = useState<DateRange>("MTD");
  const [compare, setCompare] = useState<CompareMode>("prior");
  const [pageFilter, setPageFilter] = useState<PageFilter>("all");
  const [attrModel, setAttrModel] = useState<AttrModel>("linear");
  const [viewMode, setViewMode] = useState("Charts");

  // ── Panel visibility ─────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // ── KPI / Spend ──────────────────────────────────────────────────────────
  const [spend, setSpend] = useState<ClientSpend>(initialSpend);
  const [visibleKpis, setVisibleKpis] = useState<string[]>(DEFAULT_KPI_IDS);

  // ── Live data ────────────────────────────────────────────────────────────
  const [contactSummary, setContactSummary] = useState<Record<string, number>>({});
  const [dealSummary, setDealSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  const clientId = activeClient.id;
  const accent = activeClient.primaryColor;
  const periodKey = periodKeyForDate(dateRange);

  // ── Fetch KPI data ────────────────────────────────────────────────────────
  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const [contacts, deals] = await Promise.all([
        fetch(`/api/clients/${clientId}/contacts?dateRange=${dateRange}`).then((r) => r.json()),
        fetch(`/api/clients/${clientId}/deals?dateRange=${dateRange}`).then((r) => r.json()),
      ]);
      setContactSummary({ leads: contacts.total ?? 0, sqls: contacts.sqls ?? 0 });
      setDealSummary({ deals: deals.total ?? 0, closed: deals.closed ?? 0, revenue: deals.revenue ?? 0 });
    } catch {
      // Client may not be connected yet — use zeros
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  // ── Notifications + alerts ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/alert-rules").then((r) => r.json()).then((d) => setAlerts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const totalLeads = contactSummary.leads ?? 0;
  const totalSQL = contactSummary.sqls ?? 0;
  const totalDeals = dealSummary.deals ?? 0;
  const totalClosed = dealSummary.closed ?? 0;
  const totalRevenue = dealSummary.revenue ?? 0;
  const totalSpend = spend.services + spend.hubspot + spend.ads;
  const roi = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1) : "—";
  const roas = spend.ads > 0 ? (totalRevenue / spend.ads).toFixed(2) : "—";
  const cpl = totalLeads > 0 ? "$" + (totalSpend / totalLeads).toFixed(0) : "—";

  const ALL_KPI_CARDS = [
    { id: "leads",   label: "Total Leads",        value: fmtN(totalLeads),  delta: 12, tip: "All HubSpot contacts in the date range.", benchmark: `${BENCHMARKS.convRate}% conv` },
    { id: "sql",     label: "SQLs",               value: fmtN(totalSQL),    delta: 9,  tip: "Contacts with lifecycle = SQL.", benchmark: `${BENCHMARKS.sqlRate}% SQL rate` },
    { id: "deals",   label: "Total Deals",        value: fmtN(totalDeals),  delta: 7,  tip: "All HubSpot deals in the period.", benchmark: null },
    { id: "closed",  label: "Closed Won",         value: fmtN(totalClosed), delta: 14, tip: "Deals with stage = Closed Won.", benchmark: `${BENCHMARKS.closeRate}% close rate` },
    { id: "revenue", label: "Attributed Revenue", value: fmt(totalRevenue), delta: 8,  tip: "Closed deal amounts.", benchmark: null },
    { id: "roi",     label: "Marketing ROI",      value: roi === "—" ? "—" : roi + "%", delta: 5, tip: "(Revenue − Spend) ÷ Spend × 100.", benchmark: `${BENCHMARKS.roi}% industry avg` },
    { id: "roas",    label: "ROAS",               value: roas === "—" ? "—" : roas + "x", delta: -3, tip: "Revenue ÷ Ad Spend.", benchmark: `${BENCHMARKS.roas}x industry avg` },
    { id: "cpl",     label: "Cost per Lead",      value: cpl, delta: -7, tip: "Total Spend ÷ Total Leads.", benchmark: `$${BENCHMARKS.cpl} industry avg` },
  ];

  // ── Load saved view ──────────────────────────────────────────────────────
  const loadView = (v: SavedView) => {
    setDateRange(v.dateRange);
    setAttrModel(v.attrModel);
    setPageFilter(v.pageFilter);
    setNav(v.nav);
    setCompare(v.comparePeriod);
    setShowSavedViews(false);
  };

  // ── Alert handlers ────────────────────────────────────────────────────────
  const handleAlertToggle = async (id: string, active: boolean) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active } : a));
    await fetch("/api/alert-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active }) });
  };

  const handleAlertDelivery = async (id: string, delivery: string[]) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, delivery: delivery as ("inapp" | "email")[] } : a));
    await fetch("/api/alert-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, delivery }) });
  };

  const handleMarkRead = async (id?: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { markAllRead: true }) });
    setNotifications((prev) => id ? prev.map((n) => n.id === id ? { ...n, read: true } : n) : prev.map((n) => ({ ...n, read: true })));
  };

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = async (sections: string[]) => {
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: activeClient.name,
        dateRange,
        sections,
        chartImages: {},
        kpis: { leads: totalLeads, sqls: totalSQL, deals: totalDeals, closed: totalClosed, revenue: totalRevenue },
        pages: [],
        spend,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeClient.name}-${dateRange}.pdf`;
      a.click();
    }
  };

  const viewProps = { clientId, dateRange, compare, accent, showBenchmarks, viewMode, setViewMode: (v: string) => setViewMode(v), attrModel, pageFilter, setPageFilter: (v: string) => setPageFilter(v as PageFilter), setAttrModel: (v: string) => setAttrModel(v as AttrModel), spend };

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#f4f4f2", minHeight: "100vh" }}>
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} onMarkRead={handleMarkRead} alerts={alerts} onAlertToggle={handleAlertToggle} onAlertDelivery={handleAlertDelivery} accent={accent} />

      <Sidebar clients={clients} activeClient={activeClient} nav={nav} onNavChange={setNav} showSettings={showSettings} onSettingsToggle={() => setShowSettings((s) => !s)} />

      <div style={{ marginLeft: 218 }}>
        <Topbar
          client={activeClient} dateRange={dateRange} onDateRange={setDateRange}
          compare={compare} onCompare={setCompare}
          showBenchmarks={showBenchmarks} onBenchmarks={() => setShowBenchmarks((b) => !b)}
          showSavedViews={showSavedViews} onSavedViews={() => setShowSavedViews((s) => !s)}
          showReportBuilder={showReportBuilder} onReportBuilder={() => setShowReportBuilder((s) => !s)}
          notifications={notifications} onNotifications={() => setNotifOpen((o) => !o)} notifOpen={notifOpen}
        />

        <div style={{ padding: "20px 24px" }}>
          {/* Saved Views */}
          {showSavedViews && (
            <div style={{ marginBottom: 20 }}>
              <SavedViewsPanel clientId={clientId} accent={accent} currentState={{ clientId, dateRange, attrModel, pageFilter, nav, comparePeriod: compare }} onLoad={loadView} />
            </div>
          )}

          {/* Report Builder */}
          {showReportBuilder && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #6C348330", padding: 22, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 4, height: 20, borderRadius: 2, background: "#6C3483" }} />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>PDF Report Builder — {activeClient.name}</h2>
              </div>
              <ReportBuilder clientId={clientId} clientName={activeClient.name} accent={accent} dateRange={dateRange} onExportPDF={handleExportPDF} />
            </div>
          )}

          {/* Settings */}
          {showSettings && (
            <SettingsPanel client={activeClient} accent={accent} spend={spend} onSpendChange={setSpend} visibleKpis={visibleKpis} onKpisChange={setVisibleKpis} />
          )}

          {/* Benchmarks banner */}
          {showBenchmarks && (
            <div style={{ background: "#E6F1FB", border: "1px solid #1A527630", borderRadius: 12, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A5276" }}>Industry Benchmarks Active — Home Services / Roofing / Construction</div>
                <div style={{ fontSize: 11, color: "#1A5276", opacity: 0.8, marginTop: 2 }}>
                  Avg CPL: <strong>${BENCHMARKS.cpl}</strong> · Avg ROAS: <strong>{BENCHMARKS.roas}x</strong> · Avg Close Rate: <strong>{BENCHMARKS.closeRate}%</strong> · Avg ROI: <strong>{BENCHMARKS.roi}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* KPI bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {ALL_KPI_CARDS.filter((k) => visibleKpis.includes(k.id)).map((k) => (
              <KpiCard key={k.id} label={k.label} value={loading ? "…" : k.value} delta={k.delta} accent={accent} tip={k.tip} benchmark={k.benchmark ?? undefined} showBenchmarks={showBenchmarks} />
            ))}
          </div>

          {/* Views */}
          {nav === "dashboard"    && <DashboardView    {...viewProps} periodKey={periodKey} />}
          {nav === "attribution"  && <AttributionView  {...viewProps} />}
          {nav === "roi"          && <RoiView           {...viewProps} />}
          {nav === "heatmap"      && <LeadMapView       {...viewProps} />}
          {nav === "journeymap"   && <JourneyMapView    accent={accent} />}
          {nav === "paths"        && <PathsView         {...viewProps} />}
          {nav === "cta"          && <CtaView           {...viewProps} />}
          {nav === "adanalysis"   && <AdAnalysisView    {...viewProps} />}
          {nav === "spam"         && <SpamView          {...viewProps} />}

          {/* Footer */}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setShowReportBuilder(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #6C3483", background: "transparent", color: "#6C3483", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📄 Build PDF Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
