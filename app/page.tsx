import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  // Find first active client to redirect to
  const firstClient = await db.query.clients.findFirst({
    where: eq(clients.active, true),
  });

  if (firstClient) redirect(`/dashboard/${firstClient.id}`);

  // No clients yet — admins go to admin, others see a waiting page
  const role = (session.user as { role?: string }).role;
  if (role === "admin") redirect("/admin");

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>No clients configured yet</h1>
        <p style={{ color: "#888", fontSize: 14 }}>Ask an admin to set up your first client and connect a HubSpot portal.</p>
      </div>
    </div>
  );
}
