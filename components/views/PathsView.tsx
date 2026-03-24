"use client";
import { useState, useEffect } from "react";
import { SecHead } from "@/components/shared/SecHead";
import { Badge } from "@/components/shared/Badge";
import { fmt } from "@/lib/utils/formatters";

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

interface JourneyPath {
  id: string;
  contact: string;
  path: string[];
  converted: boolean;
  value: number;
}

export function PathsView({ clientId, dateRange, accent }: Props) {
  const [paths, setPaths] = useState<JourneyPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/timeline?dateRange=${dateRange}`)
      .then(r => r.json())
      .then(d => setPaths(Array.isArray(d) ? d : []))
      .catch(() => setPaths([]))
      .finally(() => setLoading(false));
  }, [clientId, dateRange]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading journeys…</div>;

  return (
    <div>
      <SecHead
        title="Individual Conversion Journeys"
        sub="Full touchpoint path per contact"
        accent={accent}
        tip="Reconstructed from HubSpot timeline events in chronological order. Requires HubSpot Enterprise for full timeline access."
      />

      {paths.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#bbb", border: "1px solid #eee" }}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No journey data available</div>
          <div style={{ fontSize: 13 }}>Connect HubSpot to see individual contact journeys. Full multi-touch timeline requires HubSpot Enterprise.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {paths.map(path => (
          <div key={path.id} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #eee" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {path.contact[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{path.contact}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{path.path.length} touchpoints</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {path.converted && <span style={{ fontSize: 13, fontWeight: 700, color: "#1D6A3A" }}>{fmt(path.value)}</span>}
                <Badge color={path.converted ? "#1D6A3A" : "#C0392B"}>{path.converted ? "Converted" : "Not converted"}</Badge>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              {path.path.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ padding: "5px 11px", borderRadius: 20, background: accent + "15", color: accent, fontSize: 11, fontWeight: 600, border: `1px solid ${accent}25` }}>{step}</div>
                  {i < path.path.length - 1 && <div style={{ padding: "0 4px", color: "#ccc", fontSize: 14 }}>→</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
