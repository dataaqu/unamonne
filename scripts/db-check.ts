import "dotenv/config";

import { sql } from "drizzle-orm";

import { db } from "../src/lib/db";

/**
 * Smoke-checks that the configured DATABASE_URL actually connects and can run
 * a query. Run with: `npm run db:check`.
 */
async function main() {
  const result = await db.execute(sql`select 1 as ok`);
  const rows = "rows" in result ? result.rows : result;
  console.log("✅ Database connection OK:", rows);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1);
  });
