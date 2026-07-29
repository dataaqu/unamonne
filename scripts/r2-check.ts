import "./load-env";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getR2Env } from "../src/lib/media/env";
import { createUploadUrl, mediaKey, publicUrl } from "../src/lib/media/r2";

/**
 * End-to-end smoke check for Cloudflare R2, exercising the exact path the admin
 * image uploader uses: presign a PUT, upload through it, then read the object
 * back from the public base URL. Cleans up after itself. Run with:
 * `npm run r2:check`.
 */
async function main() {
  const env = getR2Env();
  console.log(`bucket: ${env.bucket} @ ${env.accountId}`);

  const key = mediaKey("_smoke", "r2-check.txt");
  const body = `r2-check ${new Date().toISOString()}`;

  const uploadUrl = await createUploadUrl(key, "text/plain");
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "text/plain" },
    body,
  });
  if (!put.ok) {
    throw new Error(`presigned PUT failed: ${put.status} ${await put.text()}`);
  }
  console.log("✅ presigned upload OK");

  const url = publicUrl(key);
  const get = await fetch(url, { cache: "no-store" });
  const text = get.ok ? await get.text() : "";
  if (!get.ok || text !== body) {
    throw new Error(
      `public read failed: ${get.status} at ${url} (public access enabled?)`,
    );
  }
  console.log(`✅ public read OK: ${url}`);

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  await client.send(
    new DeleteObjectCommand({ Bucket: env.bucket, Key: key }),
  );
  console.log("✅ cleanup OK");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ R2 check failed:");
    console.error(error);
    process.exit(1);
  });
