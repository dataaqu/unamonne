import { config as loadEnv } from "dotenv";

/**
 * Import for side effects at the top of any script run outside Next.js.
 *
 * Next.js loads `.env.local` itself, but plain `tsx scripts/*.ts` runs do not,
 * so the same file has to be loaded here. `.env` stays in the list as a
 * fallback; the first file to define a key wins, and real environment
 * variables win over both — which is what lets CI and one-off overrides
 * (`DATABASE_URL=... npm run db:check`) take precedence.
 */
loadEnv({ path: [".env.local", ".env"], quiet: true });
