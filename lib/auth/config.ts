import type { NextAuthOptions } from "next-auth";
import HubspotProvider from "next-auth/providers/hubspot";
import { db, allowedUsers, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    HubspotProvider({
      clientId: process.env.HUBSPOT_CLIENT_ID!,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/auth/error?error=NoEmail";

      // Check invite list
      const invited = await db.query.allowedUsers.findFirst({
        where: eq(allowedUsers.email, user.email.toLowerCase()),
      });
      if (!invited) return "/auth/error?error=NotInvited";

      // Upsert user record
      await db
        .insert(users)
        .values({
          email: user.email.toLowerCase(),
          name: user.name ?? null,
          image: user.image ?? null,
          role: "user",
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });

      return true;
    },

    async jwt({ token, user: _user }) {
      if (token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email.toLowerCase()),
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.userId) (session.user as { id?: string; role?: string }).id = token.userId as string;
        if (token.role) (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
