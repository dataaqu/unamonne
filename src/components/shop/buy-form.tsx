"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { BackInStockForm } from "@/components/shop/back-in-stock-form";
import { SizeGuide } from "@/components/shop/size-guide";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import { addToCartAction, type CartActionState } from "@/lib/cart-actions";
import { MAX_ENGRAVING } from "@/lib/cart-limits";
import type { Region } from "@/lib/currency";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

export type BuyVariant = {
  id: string;
  label: string;
  stock: number;
  isMadeToOrder: boolean;
};

/**
 * The buy panel: size, engraving, quantity, add to bag.
 *
 * Availability is stated per size rather than for the piece as a whole, because
 * that is the question a jewellery buyer actually has. A size with no stock but
 * `isMadeToOrder` stays orderable with a longer lead time; one with neither is
 * struck through and offers a back-in-stock note instead.
 *
 * The button carries the running total so the price never has to be recomputed
 * in the shopper's head when they change the quantity.
 */
export function BuyForm({
  productId,
  variants,
  unitPrice,
  region,
  allowEngraving,
  isSoldOut,
  locale,
}: {
  productId: string;
  variants: BuyVariant[];
  unitPrice: number;
  region: Region;
  allowEngraving: boolean;
  isSoldOut: boolean;
  locale: string;
}) {
  const t = useTranslations("Product");
  const tCart = useTranslations("Cart");

  const firstBuyable = variants.find((v) => v.stock > 0 || v.isMadeToOrder);
  const [variantId, setVariantId] = useState(firstBuyable?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [engraving, setEngraving] = useState("");

  const [state, action, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(addToCartAction, undefined);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const madeToOrder = selected ? selected.stock === 0 && selected.isMadeToOrder : false;
  const variantSoldOut = selected ? selected.stock === 0 && !selected.isMadeToOrder : false;
  const unavailable = isSoldOut || variantSoldOut || (variants.length > 0 && !selected);

  const total = unitPrice * quantity;

  const availability = (() => {
    if (isSoldOut) return t("soldOut");
    if (!selected) return variants.length > 0 ? t("chooseSize") : t("inStockShips");
    if (variantSoldOut) return t("variantSoldOut", { label: selected.label });
    if (madeToOrder) return t("madeToOrder", { label: selected.label });
    if (selected.stock <= 2) {
      return t("onlyLeft", { count: selected.stock, label: selected.label });
    }
    return t("inStockShips");
  })();

  return (
    <div>
      {variants.length > 0 ? (
        <div className="mt-9 border-t border-ink-200 pt-7">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {t("size")}
            </span>
            <SizeGuide
              selectedLabel={selected?.label ?? null}
              onPick={(label) => {
                const match = variants.find((v) => v.label === label);
                if (match && (match.stock > 0 || match.isMadeToOrder)) {
                  setVariantId(match.id);
                }
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const buyable = variant.stock > 0 || variant.isMadeToOrder;
              const active = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={!buyable}
                  onClick={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "h-11 min-w-12 px-3 text-[13px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2",
                    active
                      ? "bg-ink-900 text-ink-50"
                      : "border border-ink-300 text-ink-700 hover:border-ink-900",
                    buyable
                      ? ""
                      : "cursor-not-allowed border-ink-200 text-ink-300 line-through hover:border-ink-200",
                  )}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-ink-500">{availability}</p>
        </div>
      ) : (
        <p className="mt-7 text-xs text-ink-500">{availability}</p>
      )}

      {allowEngraving && !unavailable ? (
        <div className="mt-7">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {t("engraving", { max: MAX_ENGRAVING })}
            </span>
            <input
              value={engraving}
              maxLength={MAX_ENGRAVING}
              onChange={(event) => setEngraving(event.target.value)}
              placeholder={t("engravingPlaceholder")}
              className="mt-2 h-11 w-full max-w-xs rounded-none border-0 border-b border-ink-300 bg-transparent px-0 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
            />
          </label>
          <div className="mt-1.5 text-xs tabular-nums text-ink-500">
            {engraving.length}/{MAX_ENGRAVING}
          </div>
        </div>
      ) : null}

      <form action={action} className="mt-8">
        <input type="hidden" name="productId" value={productId} />
        {variantId ? (
          <input type="hidden" name="variantId" value={variantId} />
        ) : null}
        {allowEngraving && engraving.trim() ? (
          <input type="hidden" name="engraving" value={engraving.trim()} />
        ) : null}
        <input type="hidden" name="quantity" value={quantity} />

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center border border-ink-300">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label={t("decrease")}
              className="flex h-14 w-12 items-center justify-center text-ink-700 transition-colors hover:bg-ink-200/60 disabled:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              disabled={selected ? !madeToOrder && quantity >= selected.stock : false}
              aria-label={t("increase")}
              className="flex h-14 w-12 items-center justify-center text-ink-700 transition-colors hover:bg-ink-200/60 disabled:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={unavailable || pending}
            className="h-14 flex-1 bg-ink-900 px-8 text-xs uppercase tracking-[0.18em] text-ink-50 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 disabled:bg-ink-200 disabled:text-ink-400"
          >
            {pending
              ? t("adding")
              : unavailable
                ? t("soldOut")
                : madeToOrder
                  ? t("orderMadeToOrder", { price: formatPrice(total, region) })
                  : t("addToBag", { price: formatPrice(total, region) })}
          </button>
        </div>
      </form>

      {state?.ok ? (
        <Notice tone="success" role="status" className="mt-4">
          {t("added")}{" "}
          <Link href="/cart" className="underline underline-offset-4">
            {t("viewBag")}
          </Link>
        </Notice>
      ) : null}
      {state && !state.ok ? (
        <Notice tone="danger" role="alert" className="mt-4">
          {tCart(`errors.${state.error ?? "UNKNOWN"}`)}
        </Notice>
      ) : null}

      {unavailable ? (
        <BackInStockForm
          productId={productId}
          variantId={variantSoldOut ? variantId : null}
          locale={locale}
          className="mt-6"
        />
      ) : null}
    </div>
  );
}
