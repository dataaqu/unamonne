"use server";

import { auth } from "@/lib/auth";

import { createUploadUrl, mediaKey, publicUrl } from "./r2";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export type UploadTarget = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

/**
 * Admin-only. Returns a presigned R2 PUT URL for a product image plus the public
 * URL to persist once the browser has uploaded the file. The upload itself goes
 * browser → R2 directly.
 */
export async function createProductImageUpload(input: {
  filename: string;
  contentType: string;
}): Promise<UploadTarget> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
  if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }

  const key = mediaKey("products", input.filename);
  const uploadUrl = await createUploadUrl(key, input.contentType);

  return { key, uploadUrl, publicUrl: publicUrl(key) };
}
