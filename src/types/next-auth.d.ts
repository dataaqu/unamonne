import type { DefaultSession } from "next-auth";

type UserRole = "customer" | "admin";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

// The JWT interface is declared in @auth/core/jwt; next-auth/jwt only
// re-exports it, so the augmentation must target the original module.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
