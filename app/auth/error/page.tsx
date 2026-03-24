export default function AuthErrorPage({ searchParams }: { searchParams: { error?: string } }) {
  const isNotInvited = searchParams.error === "NotInvited";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f4f4f2", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 52px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>{isNotInvited ? "🔒" : "⚠️"}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 10 }}>
          {isNotInvited ? "Access Denied" : "Authentication Error"}
        </h1>
        <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {isNotInvited
            ? "Your email is not on the invitation list. Please contact your agency admin to request access."
            : "An error occurred during sign-in. Please try again."}
        </p>
        <a href="/auth/login"
          style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "#6C3483", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
