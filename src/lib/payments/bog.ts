/**
 * Bank of Georgia iPay (api.bog.ge) — the GE/GEL rail. OAuth client-credentials
 * for a token, then create a hosted-payment order and redirect the shopper to
 * it; a callback later confirms payment. Amounts in our data are minor units
 * (tetri); BoG wants major units (GEL), so they are divided by 100 at the edge.
 *
 * Network calls are env-gated: without BOG_CLIENT_ID/SECRET they throw a clear
 * error rather than making a bogus request, so the app builds before the
 * merchant account exists. The payload builder and callback parser are pure and
 * unit-tested.
 */
import crypto from "node:crypto";

const BOG_AUTH_URL =
  "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";
const BOG_ORDERS_URL = "https://api.bog.ge/payments/v1/ecommerce/orders";

export type BogOrderInput = {
  id: string;
  total: number;
  items: {
    productId: string | null;
    id: string;
    nameSnapshot: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type BogOrderPayload = {
  callback_url: string;
  external_order_id: string;
  purchase_units: {
    currency: "GEL";
    total_amount: number;
    basket: {
      product_id: string;
      description: string;
      quantity: number;
      unit_price: number;
    }[];
  };
  redirect_urls: { success: string; fail: string };
};

/** Minor units (tetri) → major units (GEL) with 2 decimals, as BoG expects. */
function toMajor(minorUnits: number): number {
  return Math.round(minorUnits) / 100;
}

export function buildBogOrderPayload({
  order,
  callbackUrl,
  successUrl,
  failUrl,
}: {
  order: BogOrderInput;
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
}): BogOrderPayload {
  return {
    callback_url: callbackUrl,
    external_order_id: order.id,
    purchase_units: {
      currency: "GEL",
      total_amount: toMajor(order.total),
      basket: order.items.map((item) => ({
        product_id: item.productId ?? item.id,
        description: item.nameSnapshot,
        quantity: item.quantity,
        unit_price: toMajor(item.unitPrice),
      })),
    },
    redirect_urls: { success: successUrl, fail: failUrl },
  };
}

/**
 * Read a BoG callback into our terms. BoG wraps the order under `body` with an
 * `order_status.key`; `completed` means the money settled. Anything else (or a
 * shape we don't recognize) is treated as not-paid — fail closed.
 */
export function parseBogCallback(payload: unknown): {
  externalOrderId: string;
  paid: boolean;
} {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = ((root.body as Record<string, unknown>) ?? root) as Record<
    string,
    unknown
  >;
  const status =
    ((data.order_status as Record<string, unknown>)?.key as string) ??
    (data.status as string) ??
    "";
  const externalOrderId = (data.external_order_id as string) ?? "";
  return { externalOrderId, paid: status === "completed" };
}

/**
 * Verify a BoG callback before trusting a single byte of it. BoG signs the raw
 * request body with RSA-SHA256; the signature arrives in the `Callback-Signature`
 * header (base64) and is checked against BoG's published public key
 * (BOG_CALLBACK_PUBLIC_KEY, PEM). Fails closed: no configured key, no signature,
 * or a bad signature all return false, so the webhook rejects the request and
 * never mutates an order. This is the auth boundary for a money-moving endpoint.
 */
export function verifyBogCallback(
  rawBody: string,
  signature: string | null,
): boolean {
  const pem = process.env.BOG_CALLBACK_PUBLIC_KEY;
  if (!pem || !signature) return false;

  try {
    return crypto.verify(
      "RSA-SHA256",
      Buffer.from(rawBody, "utf8"),
      pem.replace(/\\n/g, "\n"),
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

function credentials(): { id: string; secret: string } {
  const id = process.env.BOG_CLIENT_ID;
  const secret = process.env.BOG_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Bank of Georgia credentials are not configured");
  }
  return { id, secret };
}

async function getAccessToken(): Promise<string> {
  const { id, secret } = credentials();
  const res = await fetch(BOG_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`BoG auth failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Create a hosted-payment order; returns the URL to redirect the shopper to. */
export async function createBogPayment(
  payload: BogOrderPayload,
): Promise<{ id: string; redirectUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(BOG_ORDERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`BoG order failed: ${res.status}`);

  const json = (await res.json()) as {
    id: string;
    _links?: { redirect?: { href?: string } };
  };
  const redirectUrl = json._links?.redirect?.href;
  if (!redirectUrl) throw new Error("BoG order returned no redirect URL");
  return { id: json.id, redirectUrl };
}
