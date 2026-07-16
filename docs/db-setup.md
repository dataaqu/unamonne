# Database setup — pending steps (Neon)

The app's data layer is wired (`src/lib/db`, `drizzle.config.ts`, schema in
`src/lib/db/schema*`). Development continues **without a live database** — schema
definitions and migration files are generated offline. Only *applying* migrations
and running real queries need a connection.

## When you add Neon, do this once

1. **Create a Neon Postgres database**
   - Vercel Marketplace → Neon (auto-provisions env vars), or [neon.tech](https://neon.tech).
2. **Set the connection string** in `.env.local` (copy from `.env.example`):
   ```
   DATABASE_URL=postgres://<user>:<pass>@<host>/<db>?sslmode=require
   ```
   Use the **pooled** connection string (the `neon-serverless` driver connects over WebSocket).
3. **Verify the connection:**
   ```
   npm run db:check
   ```
4. **Create the tables** from the current schema:
   ```
   npm run db:generate   # writes SQL migration into ./drizzle
   npm run db:migrate     # applies it to the database
   ```
   (For quick local iteration you can use `npm run db:push` instead of generate+migrate.)
5. **Auth secret** (needed once Auth.js lands in T1.6):
   ```
   npx auth secret        # writes AUTH_SECRET
   ```

## Notes
- Nothing in the codebase opens a connection at import time — the pool is lazy,
  so `next build`, `tsc`, and `vitest` all run without `DATABASE_URL`.
- Every schema change: re-run `db:generate` (commit the migration) then `db:migrate`.
