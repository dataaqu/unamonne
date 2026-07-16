import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Env } from "./env";

/**
 * Cloudflare R2 is S3-compatible. Admin image uploads use presigned PUT URLs so
 * the browser uploads directly to R2 — large files never pass through the app.
 */
let client: S3Client | null = null;

function r2Client(): S3Client {
  const env = getR2Env();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  return client;
}

/** Build a public delivery URL from the configured base and an object key. */
export function buildPublicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

/** Namespaced, collision-safe object key: `<prefix>/<uuid>-<safe-filename>`. */
export function mediaKey(prefix: string, filename: string): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}/${crypto.randomUUID()}-${safe || "file"}`;
}

export function publicUrl(key: string): string {
  return buildPublicUrl(getR2Env().publicBaseUrl, key);
}

export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<string> {
  const env = getR2Env();
  const command = new PutObjectCommand({
    Bucket: env.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, { expiresIn });
}
