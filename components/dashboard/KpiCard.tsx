import { Tip } from "@/components/shared/Tip";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  accent: string;
  tip?: string;
  benchmark?: string;
  showBenchmarks?: boolean;
}

export function KpiCard({ label, value, delta, accent, tip, benchmark, showBenchmarks }: KpiCardProps) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "18px 20px",
      border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      borderTop: `3px solid ${accent}`, flex: 1, minWidth: 130,
    }}>
      <div style={{
        fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", marginBottom: 6,
        display: "flex", alignItems: "center",
      }}>
        {label}{tip && <Tip text={tip} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 12, color: delta >= 0 ? "#1D6A3A" : "#C0392B", marginTop: 4, fontWeight: 600 }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs prior
        </div>
      )}
      {showBenchmarks && benchmark && (
        <div style={{
          marginTop: 6, fontSize: 11, color: "#888",
          borderTop: "1px dashed #eee", paddingTop: 5,
        }}>
          Industry avg: <span style={{ fontWeight: 700, color: "#1A5276" }}>{benchmark}</span>
        </div>
      )}
    </div>
  );
}
