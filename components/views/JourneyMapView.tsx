"use client";
import { SecHead } from "@/components/shared/SecHead";

interface Props {
  accent: string;
}

const JNODES = ["Google Ads","Organic Search","Facebook Ads","Referral","Direct","Blog Posts","Service Pages","Landing Pages","Homepage","Free Inspection CTA","Get a Quote CTA","Download Guide CTA","Form Submit","Phone Call","SQL","Deal Closed","Lost / Unqualified"];
const JLINKS = [{s:0,t:7,v:220},{s:0,t:6,v:95},{s:0,t:5,v:60},{s:1,t:5,v:180},{s:1,t:6,v:110},{s:1,t:8,v:75},{s:2,t:7,v:130},{s:2,t:8,v:55},{s:3,t:8,v:70},{s:3,t:6,v:40},{s:4,t:8,v:50},{s:5,t:11,v:140},{s:5,t:9,v:60},{s:6,t:10,v:130},{s:6,t:9,v:75},{s:7,t:9,v:280},{s:7,t:10,v:55},{s:8,t:9,v:90},{s:8,t:10,v:50},{s:9,t:12,v:230},{s:9,t:13,v:110},{s:9,t:16,v:65},{s:10,t:12,v:140},{s:10,t:13,v:65},{s:10,t:16,v:30},{s:11,t:12,v:95},{s:11,t:16,v:45},{s:12,t:14,v:320},{s:13,t:14,v:140},{s:14,t:15,v:248},{s:14,t:16,v:112}];

const COLS = [
  { label: "Traffic Origin", nodes: [0,1,2,3,4], color: "#1A5276" },
  { label: "Page Visited",   nodes: [5,6,7,8],   color: "#1D6A3A" },
  { label: "CTA Engaged",    nodes: [9,10,11],   color: "#BA7517" },
  { label: "Outcome",        nodes: [12,13,14,15,16], color: "#6C3483" },
];

export function JourneyMapView({ accent }: Props) {
  const W = 680, H = 420, PAD = 44, CW = 108;
  const GAP = (W - PAD * 2 - CW * 4) / 3;
  const colX = COLS.map((_, i) => PAD + i * (CW + GAP));

  const nodeTot: Record<number, number> = {};
  JLINKS.forEach(l => {
    nodeTot[l.s] = (nodeTot[l.s] || 0) + l.v;
    nodeTot[l.t] = (nodeTot[l.t] || 0) + l.v;
  });

  const layout: Record<number, { x: number; y: number; h: number; ci: number }> = {};
  COLS.forEach((col, ci) => {
    const total = col.nodes.reduce((s, n) => s + (nodeTot[n] || 0), 0);
    let y = 30;
    col.nodes.forEach(ni => {
      const h = Math.max(20, ((nodeTot[ni] || 0) / Math.max(total, 1)) * (H - 70));
      layout[ni] = { x: colX[ci], y, h, ci };
      y += h + 9;
    });
  });

  const srcOff: Record<number, number> = {};
  const tgtOff: Record<number, number> = {};
  JNODES.forEach((_, i) => { srcOff[i] = 0; tgtOff[i] = 0; });

  const maxV = Math.max(...JLINKS.map(l => l.v));
  const paths = JLINKS.map((l, i) => {
    const s = layout[l.s], t = layout[l.t];
    if (!s || !t) return null;
    const h = Math.max(2, (l.v / maxV) * 16);
    const sy = s.y + srcOff[l.s] + h / 2;
    const ty = t.y + tgtOff[l.t] + h / 2;
    srcOff[l.s] += h + 1;
    tgtOff[l.t] += h + 1;
    const x1 = s.x + CW, x2 = t.x, mx = (x1 + x2) / 2;
    return <path key={i} d={`M${x1},${sy} C${mx},${sy} ${mx},${ty} ${x2},${ty}`} fill="none" stroke={accent} strokeWidth={h} strokeOpacity={0.2} />;
  });

  return (
    <div>
      <SecHead title="Conversion Flow Map" sub="Aggregate view — origin → pages → CTAs → outcomes" accent={accent} tip="Built from HubSpot contact timeline events. Link thickness = volume. Requires HubSpot Enterprise for full timeline data." />
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>
          Note: Full multi-touch timeline requires HubSpot Enterprise. This diagram shows an aggregate model based on available source/URL data.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: PAD, paddingRight: PAD, marginBottom: 6 }}>
          {COLS.map((c, i) => (
            <div key={i} style={{ width: CW, textAlign: "center", fontSize: 10, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</div>
          ))}
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
          {paths}
          {COLS.map(col => col.nodes.map(ni => {
            const n = layout[ni];
            if (!n) return null;
            const bh = Math.max(20, n.h);
            return (
              <g key={ni}>
                <rect x={n.x} y={n.y} width={CW} height={bh} rx={4} fill={col.color} fillOpacity={0.85} />
                <text x={n.x + CW / 2} y={n.y + bh / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 8, fontWeight: 600, fill: "#fff", fontFamily: "inherit" }}>{JNODES[ni]}</text>
                {nodeTot[ni] && <text x={n.x + CW / 2} y={n.y + bh + 11} textAnchor="middle" style={{ fontSize: 8, fill: "#aaa", fontFamily: "inherit" }}>{nodeTot[ni]}</text>}
              </g>
            );
          }))}
        </svg>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4, flexWrap: "wrap" }}>
          {COLS.map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
