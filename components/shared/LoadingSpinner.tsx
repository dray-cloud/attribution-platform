export function LoadingSpinner({ accent = "#1A5276" }: { accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: `3px solid ${accent}22`,
        borderTopColor: accent,
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
