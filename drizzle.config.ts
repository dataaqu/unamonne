import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads `.env.local` on its own, but drizzle-kit runs outside it, so the
// same file has to be loaded here. `.env` stays in the list as a fallback; the
// first file to define a key wins, and real environment variables win over both.
loadEnv({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run drizzle-kit commands.");
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
