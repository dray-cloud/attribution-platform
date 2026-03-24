"use client";
import type { ClientRecord, DateRange, CompareMode, NotificationItem } from "@/types";

interface TopbarProps {
  client: ClientRecord;
  dateRange: DateRange;
  onDateRange: (d: DateRange) => void;
  compare: CompareMode;
  onCompare: (c: CompareMode) => void;
  showBenchmarks: boolean;
  onBenchmarks: () => void;
  showSavedViews: boolean;
  onSavedViews: () => void;
  showReportBuilder: boolean;
  onReportBuilder: () => void;
  notifications: NotificationItem[];
  onNotifications: () => void;
  notifOpen: boolean;
}

export function Topbar({
  client,
  dateRange,
  onDateRange,
  compare,
  onCompare,
  showBenchmarks,
  onBenchmarks,
  showSavedViews,
  onSavedViews,
  showReportBuilder,
  onReportBuilder,
  notifications,
  onNotifications,
  notifOpen,
}: TopbarProps) {
  const accent = client.primaryColor;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #ebebeb", padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Client info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff",
        }}>{client.logoInitials}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{client.name}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{client.industry}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Date range */}
        <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["Today", "WTD", "MTD", "QTD", "YTD"] as DateRange[]).map((d) => (
            <button
              key={d}
              onClick={() => onDateRange(d)}
              style={{
                padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: dateRange === d ? accent : "transparent",
                color: dateRange === d ? "#fff" : "#888",
                transition: "all 0.15s",
              }}
            >{d}</button>
          ))}
        </div>

        {/* Compare */}
        <select
          value={compare}
          onChange={(e) => onCompare(e.target.value as CompareMode)}
          style={{ fontSize: 12, border: "1px solid #eee", borderRadius: 8, padding: "6px 10px", color: "#555", background: "#fff" }}
        >
          <option value="prior">vs Prior Period</option>
          <option value="lastyear">vs Last Year</option>
          <option value="none">No Comparison</option>
        </select>

        {/* Benchmarks */}
        <button
          onClick={onBenchmarks}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${showBenchmarks ? "#1A5276" : "#eee"}`,
            background: showBenchmarks ? "#1A5276" : "#fff",
            color: showBenchmarks ? "#fff" : "#888",
          }}
        >📊 {showBenchmarks ? "Hide" : "Show"} Benchmarks</button>

        {/* Saved Views */}
        <button
          onClick={onSavedViews}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${showSavedViews ? accent : "#eee"}`,
            background: showSavedViews ? accent + "14" : "#fff",
            color: showSavedViews ? accent : "#888",
          }}
        >⭐ Views</button>

        {/* Report Builder */}
        <button
          onClick={onReportBuilder}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${showReportBuilder ? "#6C3483" : "#eee"}`,
            background: showReportBuilder ? "#6C348314" : "#fff",
            color: showReportBuilder ? "#6C3483" : "#888",
          }}
        >📄 Report Builder</button>

        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={onNotifications}
            style={{
              width: 36, height: 36, borderRadius: 9, border: "1px solid #eee",
              background: notifOpen ? "#fafafa" : "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}
          >🔔</button>
          {unread > 0 && (
            <div style={{
              position: "absolute", top: -4, right: -4, width: 18, height: 18,
              borderRadius: "50%", background: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#fff",
            }}>{unread}</div>
          )}
        </div>
      </div>
    </div>
  );
}
