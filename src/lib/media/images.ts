/**
 * Cloudflare Images — resize/optimize + CDN delivery.
 *
 * Delivery URLs follow https://imagedelivery.net/<account-hash>/<image-id>/<variant>.
 * Uploads use the one-time "direct upload" URL flow so the browser posts the
 * file straight to Cloudflare.
 */
export function imageDeliveryUrl(
  accountHash: string,
  imageId: string,
  variant = "public",
): string {
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

type DirectUpload = { id: string; uploadURL: string };

export async function createImageDirectUpload(): Promise<DirectUpload> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_IMAGES_TOKEN;
  if (!accountId || !token) {
    throw new Error(
      "Cloudflare Images env vars are not set (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_TOKEN).",
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json()) as {
    success: boolean;
    result?: DirectUpload;
  };
  if (!json.success || !json.result) {
    throw new Error("Cloudflare Images direct_upload request failed.");
  }
  return json.result;
}
