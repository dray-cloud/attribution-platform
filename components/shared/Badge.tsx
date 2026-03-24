export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      background: color + "22", color, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{children}</span>
  );
}
