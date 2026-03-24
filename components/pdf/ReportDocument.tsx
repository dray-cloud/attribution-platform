import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { REPORT_SECTIONS } from "@/types";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#f4f4f2", padding: 0 },
  cover: { backgroundColor: "#1a1a1a", flex: 1, padding: 48, justifyContent: "center" },
  coverTitle: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  coverSub: { color: "#aaa", fontSize: 14, marginBottom: 4 },
  coverAccent: { height: 4, width: 60, borderRadius: 2, marginBottom: 32 },

  body: { padding: "32px 40px", backgroundColor: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4, marginTop: 24 },
  sectionSub: { fontSize: 10, color: "#888", marginBottom: 12 },
  accentBar: { height: 3, width: 40, borderRadius: 2, marginBottom: 16 },

  table: { borderWidth: 1, borderColor: "#eee", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#fafafa", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  tableCell: { padding: "8px 10px", fontSize: 10, flex: 1 },
  tableCellHead: { padding: "8px 10px", fontSize: 9, fontWeight: "bold", color: "#aaa", flex: 1, textTransform: "uppercase" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  kpiCard: { backgroundColor: "#fff", borderRadius: 8, padding: "12px 14px", borderWidth: 1, borderColor: "#eee", width: "22%", alignItems: "center" },
  kpiLabel: { fontSize: 8, color: "#aaa", textTransform: "uppercase", fontWeight: "bold", marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },

  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { fontSize: 8, color: "#aaa" },

  chartImage: { width: "100%", borderRadius: 8, marginTop: 8 },
  emptyChart: { height: 120, backgroundColor: "#f8f8f8", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  emptyChartText: { fontSize: 10, color: "#ccc" },
});

interface KpiData {
  leads: number;
  sqls: number;
  deals: number;
  closed: number;
  revenue: number;
}

interface ReportDocumentProps {
  clientName: string;
  dateRange: string;
  sections: string[];
  chartImages: Record<string, string>;
  kpis: KpiData;
  pages: { name: string; type: string; leads: number; value: number }[];
  spend: { services: number; hubspot: number; ads: number };
  accent: string;
}

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
const fmtN = (n: number) => n.toLocaleString();

export function ReportDocument({ clientName, dateRange, sections, chartImages, kpis, pages, spend, accent }: ReportDocumentProps) {
  const totalSpend = spend.services + spend.hubspot + spend.ads;
  const roi = totalSpend > 0 ? (((kpis.revenue - totalSpend) / totalSpend) * 100).toFixed(1) : "—";
  const roas = spend.ads > 0 ? (kpis.revenue / spend.ads).toFixed(2) : "—";
  const cpl = kpis.leads > 0 ? (totalSpend / kpis.leads).toFixed(0) : "—";

  const sectionLabels = Object.fromEntries(REPORT_SECTIONS.map(s => [s.id, s.label]));

  const renderSection = (sectionId: string) => {
    const image = chartImages[sectionId];
    const label = sectionLabels[sectionId] ?? sectionId;

    switch (sectionId) {
      case "kpis":
        return (
          <View key={sectionId}>
            <Text style={styles.sectionTitle}>KPI Summary</Text>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            <View style={styles.kpiGrid}>
              {[
                { label: "Total Leads", value: fmtN(kpis.leads) },
                { label: "SQLs", value: fmtN(kpis.sqls) },
                { label: "Deals", value: fmtN(kpis.deals) },
                { label: "Closed Won", value: fmtN(kpis.closed) },
                { label: "Revenue", value: fmt(kpis.revenue) },
                { label: "ROI", value: roi === "—" ? "—" : roi + "%" },
                { label: "ROAS", value: roas === "—" ? "—" : roas + "x" },
                { label: "CPL", value: cpl === "—" ? "—" : "$" + cpl },
              ].map(k => (
                <View key={k.label} style={[styles.kpiCard, { borderTopWidth: 3, borderTopColor: accent }]}>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue}>{k.value}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case "attribution":
        return (
          <View key={sectionId}>
            <Text style={styles.sectionTitle}>Page Attribution</Text>
            <Text style={styles.sectionSub}>Revenue attributed across touchpoints</Text>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            {image ? (
              <Image src={`data:image/png;base64,${image}`} style={styles.chartImage} />
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  {["Page", "Type", "Leads", "Attributed Value"].map(h => (
                    <Text key={h} style={styles.tableCellHead}>{h}</Text>
                  ))}
                </View>
                {pages.slice(0, 10).map((p, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{p.name}</Text>
                    <Text style={styles.tableCell}>{p.type}</Text>
                    <Text style={styles.tableCell}>{fmtN(p.leads)}</Text>
                    <Text style={styles.tableCell}>{fmt(p.value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      default:
        return (
          <View key={sectionId}>
            <Text style={styles.sectionTitle}>{label}</Text>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            {image ? (
              <Image src={`data:image/png;base64,${image}`} style={styles.chartImage} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Chart data not captured</Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <View style={[styles.coverAccent, { backgroundColor: accent }]} />
          <Text style={styles.coverTitle}>{clientName}</Text>
          <Text style={styles.coverSub}>Marketing Attribution Report</Text>
          <Text style={styles.coverSub}>{dateRange} Period</Text>
          <View style={{ marginTop: 40, padding: "20px 24px", backgroundColor: "#ffffff10", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 12, marginBottom: 8, fontWeight: "bold" }}>Performance Snapshot</Text>
            {[
              ["Total Leads", fmtN(kpis.leads)],
              ["Closed Won", fmtN(kpis.closed)],
              ["Attributed Revenue", fmt(kpis.revenue)],
              ["Marketing ROI", roi === "—" ? "—" : roi + "%"],
            ].map(([l, v]) => (
              <View key={l} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: "#aaa", fontSize: 11 }}>{l}</Text>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Builder Funnel — Attribution Platform</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={[styles.page, styles.body]}>
        {sections.map(id => renderSection(id))}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{clientName} — {dateRange}</Text>
          <Text style={styles.footerText}>Builder Funnel Attribution Platform</Text>
        </View>
      </Page>
    </Document>
  );
}
