/**
 * Schema barrel. Everything re-exported here is passed to
 * `drizzle(pool, { schema })` in `../index.ts` and picked up by drizzle-kit.
 *
 * Tables are added incrementally by plan tasks:
 *   - auth     T1.3  users, accounts, sessions, verificationTokens  ✅
 *   - catalog  T2.1/T2.2  categories, products (+ translations)  ✅
 *   - commerce T3.1  carts, cart items  ✅  shipping T3.3 ✅  orders T3.4 ✅
 *   - blog     T5.x  posts (+ translations)
 */
// `common` must be exported too — drizzle-kit only emits CREATE TYPE for enums
// it can reach from this barrel.
export * from "./common";
export * from "./auth";
export * from "./catalog";
export * from "./commerce";
