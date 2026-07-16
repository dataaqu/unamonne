/**
 * Cloudflare Stream — video upload + adaptive playback. Direct-upload flow: get
 * a one-time upload URL, the browser posts the video, then it's served via the
 * Stream player / HLS manifest.
 */
type StreamUpload = { uid: string; uploadURL: string };

export async function createStreamDirectUpload(
  maxDurationSeconds = 3600,
): Promise<StreamUpload> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  if (!accountId || !token) {
    throw new Error(
      "Cloudflare Stream env vars are not set (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_TOKEN).",
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds }),
    },
  );
  const json = (await res.json()) as {
    success: boolean;
    result?: StreamUpload;
  };
  if (!json.success || !json.result) {
    throw new Error("Cloudflare Stream direct_upload request failed.");
  }
  return json.result;
}
