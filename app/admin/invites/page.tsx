import { InviteManager } from "@/components/admin/InviteManager";

export default function InvitesPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Invite Management</h1>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Users must be on this list before they can log in with HubSpot OAuth.</p>
      </div>
      <InviteManager accent="#6C3483" />
    </div>
  );
}
