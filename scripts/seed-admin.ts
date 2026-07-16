import "dotenv/config";

import { eq } from "drizzle-orm";

import { hashPassword } from "../src/lib/auth/password";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

/**
 * Idempotent admin bootstrap. Reads ADMIN_EMAIL / ADMIN_PASSWORD and ensures a
 * user with role=admin exists. Re-running is safe: an existing user is promoted
 * to admin and their password reset; a new one is created.
 *
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret npm run seed:admin
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "❌ Set ADMIN_EMAIL and ADMIN_PASSWORD before running seed:admin.",
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    await db
      .update(users)
      .set({ role: "admin", passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log(`✅ Promoted existing user ${email} to admin.`);
  } else {
    await db.insert(users).values({
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
    });
    console.log(`✅ Created admin user ${email}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ seed:admin failed:");
    console.error(error);
    process.exit(1);
  });
