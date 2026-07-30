"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Btn, BtnLink } from "@/components/ui/btn";
import { BagIcon, CloseIcon, TrashIcon } from "@/components/ui/icons";
import { Overlay } from "@/components/ui/overlay";
import { useDrawer } from "@/components/ui/use-drawer";
import { Link } from "@/i18n/navigation";
import { removeItemAction, type CartActionState } from "@/lib/cart-actions";
import { cn } from "@/lib/utils";

/**
 * One bag line, already priced and localized on the server. The drawer is a
 * client component only because it opens and closes — none of the money is
 * recomputed here, so what it shows can never drift from the cart page.
 */
export type BagLine = {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
  detail: string | null;
  quantity: number;
  priceLabel: string;
};

function RemoveLineButton({
  itemId,
  label,
}: {
  itemId: string;
  label: string;
}) {
  const [, action, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(removeItemAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        className="text-ink-400 transition-colors hover:text-danger-600 disabled:opacity-40"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </form>
  );
}

/**
 * The header bag button and the drawer behind it. The button owns the drawer so
 * that adding something anywhere on the page re-renders the count and the
 * contents together — the cart actions call `refresh()`, which re-runs the
 * server render that produced these props.
 */
export function BagDrawer({
  lines,
  count,
  subtotalLabel,
  shippingNote,
  tone = "dark",
}: {
  lines: BagLine[];
  count: number;
  subtotalLabel: string;
  shippingNote: string;
  tone?: "dark" | "light";
}) {
  const t = useTranslations("Cart");
  const [open, setOpen] = useState(false);

  const { shell, scrim, panel } = useDrawer(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Freeze the page behind the drawer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("itemCount", { count })}
        aria-expanded={open}
        className={cn(
          "relative transition-opacity",
          tone === "dark"
            ? "text-ink-700 hover:text-ink-900"
            : "text-ink-50 hover:opacity-75",
        )}
      >
        <BagIcon />
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-pill bg-brand-100 text-[10px] tabular-nums text-ink-900">
            {count}
          </span>
        ) : null}
      </button>

      <Overlay>
        <div
          ref={shell}
          aria-hidden={!open}
          className="invisible fixed inset-0 z-50 flex justify-end"
        >
          <button
            ref={scrim}
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/40 opacity-0"
          />
          <aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="relative flex h-full w-full max-w-[420px] flex-col bg-ink-100 text-ink-900 shadow-float"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-5">
              <span className="text-[11px] uppercase tracking-[0.2em]">
                {t("title")} · {count}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="text-ink-600 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-auto p-6">
              {lines.length === 0 ? (
                <div className="border border-dashed border-ink-300 px-6 py-12 text-center">
                  <div className="mx-auto flex w-fit text-ink-400">
                    <BagIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-[13px] text-ink-700">{t("empty")}</p>
                  <p className="mt-1 text-xs text-ink-500">{t("emptyHint")}</p>
                </div>
              ) : (
                lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex gap-4 border-b border-ink-200 pb-5"
                  >
                    <Link
                      href={line.href}
                      onClick={() => setOpen(false)}
                      className="h-24 w-20 shrink-0 bg-accent-100"
                    >
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.imageUrl}
                          alt={line.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={line.href}
                        onClick={() => setOpen(false)}
                        className="text-[11px] uppercase tracking-[0.16em] hover:underline"
                      >
                        {line.name}
                      </Link>
                      <div className="mt-1 text-xs text-ink-500">
                        {line.detail ? `${line.detail} · ` : ""}
                        {t("qtyShort", { count: line.quantity })}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm tabular-nums">
                          {line.priceLabel}
                        </span>
                        <RemoveLineButton
                          itemId={line.id}
                          label={t("remove")}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-ink-200 p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  {t("subtotal")}
                </span>
                <span className="text-lg tabular-nums">{subtotalLabel}</span>
              </div>
              <p className="mt-2 text-xs text-ink-500">{shippingNote}</p>
              <div className="mt-5 space-y-2">
                {lines.length > 0 ? (
                  <BtnLink
                    href="/checkout"
                    size="lg"
                    full
                    onClick={() => setOpen(false)}
                  >
                    {t("checkout")}
                  </BtnLink>
                ) : (
                  <BtnLink
                    href="/shop"
                    size="lg"
                    full
                    onClick={() => setOpen(false)}
                  >
                    {t("continueShopping")}
                  </BtnLink>
                )}
                <Btn variant="ghost" full onClick={() => setOpen(false)}>
                  {lines.length > 0 ? t("continueShopping") : t("close")}
                </Btn>
              </div>
            </div>
          </aside>
        </div>
      </Overlay>
    </>
  );
}
