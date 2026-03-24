import { Tip } from "./Tip";

interface SecHeadProps {
  title: string;
  sub?: string;
  accent: string;
  tip?: string;
}

export function SecHead({ title, sub, accent, tip }: SecHeadProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: accent }} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a", display: "flex", alignItems: "center" }}>
          {title}{tip && <Tip text={tip} />}
        </h2>
      </div>
      {sub && <div style={{ fontSize: 13, color: "#888", marginTop: 4, paddingLeft: 14 }}>{sub}</div>}
    </div>
  );
}
