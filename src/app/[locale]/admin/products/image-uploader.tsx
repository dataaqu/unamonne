"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { createProductImageUpload } from "@/lib/media/actions";

/**
 * Uploads product images to R2 via presigned PUT (browser → R2 directly), then
 * carries the resulting public URLs in hidden inputs for the form.
 *
 * `name` defaults to `imageUrls` (the product gallery). The editorial settings
 * form renders several uploaders in one form and gives each its own name, so
 * the values stay separable server-side.
 */
export function ImageUploader({
  initialUrls = [],
  name = "imageUrls",
}: {
  initialUrls?: string[];
  name?: string;
}) {
  const t = useTranslations("Admin.form");
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const target = await createProductImageUpload({
          filename: file.name,
          contentType: file.type,
        });
        const res = await fetch(target.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error("upload failed");
        setUrls((prev) => [...prev, target.publicUrl]);
      }
    } catch {
      setError("UPLOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="size-20 rounded border object-cover"
            />
            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 size-5 rounded-full bg-destructive text-xs text-white"
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        disabled={busy}
        className="text-sm"
      />
      {busy ? (
        <p className="text-sm text-muted-foreground">{t("saving")}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
