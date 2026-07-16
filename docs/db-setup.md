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

## Running against a local Postgres (no Neon account needed)

The `neon-serverless` driver speaks WebSocket, so it cannot reach a plain
Postgres directly — `drizzle-kit migrate` against one just hangs. Put Neon's
`wsproxy` in front of it and the whole app works locally:

```sh
docker network create vintage-test
docker run -d --name vintage-pg --network vintage-test \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=vintage -p 55432:5432 postgres:17-alpine
docker run -d --name vintage-wsproxy --network vintage-test \
  -e APPEND_PORT="vintage-pg:5432" -e ALLOW_ADDR_REGEX=".*" \
  -p 55433:80 ghcr.io/neondatabase/wsproxy:latest

# Apply the schema (psql, since drizzle-kit cannot talk to it directly):
sed 's/--> statement-breakpoint//' drizzle/0000_init.sql \
  | docker exec -i vintage-pg psql -U postgres -d vintage -v ON_ERROR_STOP=1

# Then run the app. The host in DATABASE_URL is resolved by the proxy, not by you:
export DATABASE_URL="postgres://postgres:test@vintage-pg:5432/vintage"
export NEON_WS_PROXY="localhost:55433/v1"
export AUTH_SECRET="throwaway-local-secret"
npm run build && npx next start -p 3199

docker rm -f vintage-pg vintage-wsproxy && docker network rm vintage-test  # when done
```

`NEON_WS_PROXY` is read in `src/lib/db/index.ts` and must stay unset in Neon and
in every deployed environment, where Neon terminates the WebSocket itself.

Note that `drizzle-kit generate` requires `DATABASE_URL` to be set (the config
throws without it) but never connects, so any placeholder value works.

## Notes
- Nothing in the codebase opens a connection at import time — the pool is lazy,
  so `next build`, `tsc`, and `vitest` all run without `DATABASE_URL`.
- Every schema change: re-run `db:generate` (commit the migration) then `db:migrate`.
- New `pgEnum`s must be exported from `src/lib/db/schema/index.ts`, or drizzle-kit
  cannot see them and silently emits no `CREATE TYPE` for them.
