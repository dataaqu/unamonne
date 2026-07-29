import { and, eq, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { abandonedCartEmails, cartItems, carts } from "@/lib/db/schema";

/**
 * How long a cart may sit untouched before it counts as abandoned. The recovery
 * cron (T4.3) runs on this window; kept here so the boundary and the query
 * agree on one number.
 */
export const DEFAULT_IDLE_HOURS = 24;

/** The moment a cart must have been idle since to count as abandoned. */
export function abandonmentCutoff(now: Date, idleHours = DEFAULT_IDLE_HOURS): Date {
  return new Date(now.getTime() - idleHours * 60 * 60 * 1000);
}

/**
 * Whether a cart qualifies for a recovery email: still `active` (a converted or
 * already-abandoned cart is done), has items (an empty cart is nothing to
 * recover), and untouched since the cutoff. Pure, so the boundary is testable
 * without a clock or a database.
 */
export function isAbandonmentCandidate(
  cart: { status: string; updatedAt: Date; itemCount: number },
  now: Date,
  idleHours = DEFAULT_IDLE_HOURS,
): boolean {
  return (
    cart.status === "active" &&
    cart.itemCount > 0 &&
    cart.updatedAt <= abandonmentCutoff(now, idleHours)
  );
}

/**
 * Bearer-token guard for the Vercel Cron route. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` when the env var is set. Fails closed:
 * no configured secret means no access, so the endpoint is never left open.
 */
export function isAuthorizedCron(
  authHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/** A short, human-friendly one-time offer code, e.g. COMEBACK-7F3A. */
export function makeOfferCode(rand: () => string = () => crypto.randomUUID()): string {
  return `COMEBACK-${rand().replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export type AbandonmentCandidate = {
  id: string;
  email: string | null;
  userId: string | null;
  updatedAt: Date;
};

/**
 * Active carts idle since the cutoff that still have at least one item and have
 * never been sent a recovery email. The `has items` and `never emailed`
 * conditions are expressed as SQL EXISTS / NOT EXISTS so the database does the
 * filtering rather than loading empty or already-contacted carts. Ordered
 * oldest-first so the most-neglected carts are recovered first.
 */
export function findAbandonmentCandidates(
  now: Date,
  idleHours = DEFAULT_IDLE_HOURS,
): Promise<AbandonmentCandidate[]> {
  return db
    .select({
      id: carts.id,
      email: carts.email,
      userId: carts.userId,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .where(
      and(
        eq(carts.status, "active"),
        lte(carts.updatedAt, abandonmentCutoff(now, idleHours)),
        sql`exists (select 1 from ${cartItems} where ${cartItems.cartId} = ${carts.id})`,
        sql`not exists (select 1 from ${abandonedCartEmails} where ${abandonedCartEmails.cartId} = ${carts.id})`,
      ),
    )
    .orderBy(carts.updatedAt);
}

/**
 * Sends one recovery email. Injected so the recovery loop is testable and so
 * T4.4 can swap the log-only default for a Resend-backed sender without
 * touching the cron.
 */
export type RecoveryMailer = (input: {
  cartId: string;
  email: string | null;
  offerCode: string;
}) => Promise<void>;

/** Default mailer until Resend is wired in T4.4: records intent to the log only. */
export const logRecoveryMailer: RecoveryMailer = async ({
  cartId,
  email,
  offerCode,
}) => {
  console.info(
    `[abandoned-cart] would email ${email ?? "(no address on cart)"} for cart ${cartId} with offer ${offerCode}`,
  );
};

/**
 * Recover every currently-abandoned cart: mark it `abandoned`, log the send
 * (with a fresh offer code), then dispatch the email. Idempotent across runs —
 * the finder excludes carts already flipped or already emailed — and per run
 * each cart is handled once. A failure on one cart is logged and skipped so it
 * never blocks the rest. Returns how many were recovered.
 */
export async function recoverAbandonedCarts(
  now: Date,
  send: RecoveryMailer,
  idleHours = DEFAULT_IDLE_HOURS,
): Promise<{ recovered: number }> {
  const candidates = await findAbandonmentCandidates(now, idleHours);
  let recovered = 0;

  for (const cart of candidates) {
    const offerCode = makeOfferCode();
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(carts)
          .set({ status: "abandoned", updatedAt: new Date() })
          .where(eq(carts.id, cart.id));
        await tx.insert(abandonedCartEmails).values({ cartId: cart.id, offerCode });
      });

      await send({ cartId: cart.id, email: cart.email, offerCode });
      recovered += 1;
    } catch (error) {
      console.error("[abandoned-cart] failed to recover cart", cart.id, error);
    }
  }

  return { recovered };
}
