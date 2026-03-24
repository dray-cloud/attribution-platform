import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { LoginButton } from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f4f4f2", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 52px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#6C3483", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 20px" }}>
          📊
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>Builder Funnel</h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 32, lineHeight: 1.5 }}>Attribution Platform · Agency Portal</p>
        <LoginButton />
        <p style={{ fontSize: 11, color: "#bbb", marginTop: 20, lineHeight: 1.6 }}>
          Access is invite-only. Contact your admin if you need access.
        </p>
      </div>
    </div>
  );
}
