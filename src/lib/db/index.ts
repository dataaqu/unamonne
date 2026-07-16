import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Local-only escape hatch. The neon-serverless driver speaks WebSocket, so it
 * cannot talk to a plain Postgres directly; pointing NEON_WS_PROXY at a
 * `neondatabase/wsproxy` container lets the app run against a throwaway local
 * database (see docs/db-setup.md). Unset in every deployed environment, where
 * Neon terminates the WebSocket itself.
 */
if (process.env.NEON_WS_PROXY) {
  const proxy = process.env.NEON_WS_PROXY;
  neonConfig.wsProxy = () => proxy;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

if (!connectionString) {
  // Intentionally not throwing here: route modules import `db` at build time,
  // and the app is developed before a Neon database is provisioned. The pool
  // connects lazily, so queries (not imports) fail if the URL is still missing.
  console.warn(
    "[db] DATABASE_URL is not set — database queries will fail until it is provided (see docs/db-setup.md).",
  );
}

/**
 * A single Neon connection pool for the process. The WebSocket-backed
 * `neon-serverless` driver is used (rather than `neon-http`) because later
 * tasks — checkout, order creation, the Auth.js adapter — rely on interactive
 * transactions, which the HTTP driver cannot provide.
 *
 * The pool connects lazily on first query, so importing this module is safe in
 * build/test contexts even without a live database.
 */
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export { schema };
export type Database = typeof db;
