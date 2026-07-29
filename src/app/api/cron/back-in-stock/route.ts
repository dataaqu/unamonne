import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/abandoned-cart";
import { notifyRestocked } from "@/lib/back-in-stock";
import { resendRestockMailer } from "@/lib/email/back-in-stock";

/**
 * Vercel Cron entrypoint (scheduled in vercel.json). Sweeps outstanding
 * "write to me when it is back" requests and mails the ones whose piece — or
 * whose specific size — is available again.
 *
 * Shares the abandoned-cart sweep's bearer-token guard, and is idempotent: a
 * request is stamped `notified_at` once mailed, so re-running is harmless.
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

  const { notified } = await notifyRestocked(resendRestockMailer);

  return NextResponse.json({ notified });
}
