import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/");

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", background: "#f4f4f2" }}>
      {/* Admin topbar */}
      <div style={{ background: "#1a1a1a", padding: "0 24px", display: "flex", alignItems: "center", gap: 0, height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6C3483", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📊</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Builder Funnel</span>
          <span style={{ fontSize: 11, color: "#666", marginLeft: 2 }}>Admin</span>
        </div>
        {[
          { href: "/admin", label: "Overview" },
          { href: "/admin/clients", label: "Clients" },
          { href: "/admin/invites", label: "Invites" },
        ].map(link => (
          <Link key={link.href} href={link.href}
            style={{ padding: "0 14px", height: "100%", display: "flex", alignItems: "center", fontSize: 13, color: "#aaa", textDecoration: "none", fontWeight: 500 }}>
            {link.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </div>
    </div>
  );
}
