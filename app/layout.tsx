import type { Metadata } from "next";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Builder Funnel — Attribution Platform",
  description: "Marketing attribution dashboard for home services agencies",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#f4f4f2" }}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
