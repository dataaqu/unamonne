import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";

import { CART_COOKIE, claimGuestCart } from "@/lib/cart";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";

import { verifyPassword } from "./password";

/**
 * Auth.js (v5) configuration.
 *
 * - Drizzle adapter persists users/accounts (ready for future OAuth providers).
 * - JWT session strategy: required for the Credentials provider, and it lets us
 *   carry `role` in the token so admin checks (T1.9) don't hit the DB.
 * - The `role` claim is threaded through the jwt → session callbacks.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Trust the deployment host header. Vercel sets this automatically, but it's
  // required for Node/self-hosted production and local `next start`.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    /**
     * Carry an anonymous cart across sign-in: the guest cart is claimed for the
     * user (or folded into one they already have), so items added before
     * logging in are never silently lost. Failures here must not block sign-in.
     */
    async signIn({ user }) {
      if (!user.id) return;
      try {
        const token = (await cookies()).get(CART_COOKIE)?.value;
        if (token) await claimGuestCart(user.id, token);
      } catch (error) {
        console.error("[auth] failed to claim guest cart on sign-in", error);
      }
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "customer";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "customer";
      }
      return session;
    },
  },
});
