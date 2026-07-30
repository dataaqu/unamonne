import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Auth.js (v5) Drizzle adapter tables + shop extensions.
 *
 * The `user`, `account`, `session`, and `verificationToken` tables follow the
 * shape expected by `@auth/drizzle-adapter` (wired in T1.6). Two columns are
 * added for this shop:
 *   - `role`         — gates the custom admin panel (T1.9).
 *   - `passwordHash` — Credentials provider stores a bcrypt/argon hash here
 *                       (T1.6 / registerUser in T1.7). Null for future OAuth users.
 */

export const userRole = pgEnum("user_role", ["customer", "admin"]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  /**
   * Contact number for the account itself, editable from /account. Kept apart
   * from the phone on a saved address: that one belongs to a delivery, this one
   * to the person, and the studio calls it when an order needs a decision.
   */
  phone: text("phone"),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Adapter account "type" — kept as a local union so this file has no runtime
// dependency on next-auth before it is installed in T1.6.
type AdapterAccountType = "oauth" | "oidc" | "email" | "webauthn";

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * A pending "forgot my password" request.
 *
 * Only a SHA-256 of the emailed token is stored: the token itself exists in the
 * link and nowhere else, so a leaked table cannot be used to take an account
 * over. A row is single-use (`usedAt`) and short-lived (`expiresAt`); issuing a
 * new one drops the user's older rows, so the last link mailed is the only one
 * that works.
 */
export const passwordResetTokens = pgTable(
  "password_reset_token",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("password_reset_user_idx").on(t.userId)],
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
