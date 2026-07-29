import { NextResponse } from "next/server";

import { isAuthorizedCron, recoverAbandonedCarts } from "@/lib/abandoned-cart";
import { resendRecoveryMailer } from "@/lib/email/abandoned-cart";

/**
 * Vercel Cron entrypoint (scheduled in vercel.json). Vercel calls this once a
 * day with `Authorization: Bearer <CRON_SECRET>`; anything else is rejected. It
 * sweeps stale carts, marks them abandoned, and dispatches recovery emails
 * (log-only until Resend lands in T4.4).
 *
 * Daily rather than hourly because Hobby plans allow only one run per day. The
 * sweep is idempotent — a cart is emailed at most once, guarded by the
 * `abandoned_cart_email` row — so the cadence only affects how promptly a cart
 * that crossed the 24-hour idle threshold is contacted, never whether it is.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (
    !isAuthorizedCron(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { recovered } = await recoverAbandonedCarts(
    new Date(),
    resendRecoveryMailer,
  );

  return NextResponse.json({ recovered });
}
