"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AccountHeader } from "@/components/account/account-header";
import { Btn } from "@/components/ui/btn";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Field, SelectField } from "@/components/ui/field";
import { PinIcon, PlusIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/notice";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/account/address-actions";
import type { AccountFormState } from "@/lib/account/form";
import type { CountryOption } from "@/lib/countries";
import { cn } from "@/lib/utils";

export type AddressCard = {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  line1: string;
  line2: string;
  postalCode: string;
  isDefault: boolean;
  /** Pre-rendered lines, so the card and the profile page break an address identically. */
  lines: string[];
};

/**
 * The address book. Adding and editing happen in a panel over the list rather
 * than on a page of their own — an address is four lines of typing, and losing
 * the list to type them is a worse trade than the panel costs.
 */
export function AddressesManager({
  cards,
  countries,
}: {
  cards: AddressCard[];
  countries: CountryOption[];
}) {
  const t = useTranslations("Account");
  const locale = useLocale();

  /** `"new"`, an address id, or null when nothing is open. */
  const [dialog, setDialog] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AddressCard | null>(null);

  const editing =
    dialog && dialog !== "new"
      ? (cards.find((a) => a.id === dialog) ?? null)
      : null;

  // The panel closes as part of the submission — the server action revalidates
  // the list, so by the time it shuts the card behind it is already the new one.
  const [state, formAction, pending] = useActionState(
    async (prev: AccountFormState | undefined, formData: FormData) => {
      const result = await (editing ? updateAddress : createAddress)(
        prev,
        formData,
      );
      if (result.ok) setDialog(null);
      return result;
    },
    { ok: false },
  );

  const fieldError = (field: string) => {
    const codes = state.fieldErrors?.[field];
    if (!codes?.length) return undefined;
    return codes[0] === "COUNTRY_INVALID" ? t("countryInvalid") : t("required");
  };

  return (
    <>
      <AccountHeader
        title={t("addressesTitle")}
        meta={t("addressesHint")}
        action={
          <Btn onClick={() => setDialog("new")}>
            <PlusIcon className="h-3.5 w-3.5" />
            {t("newAddress")}
          </Btn>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<PinIcon className="h-7 w-7" />}
          title={t("noAddresses")}
          body={t("noAddressesHint")}
          action={<Btn onClick={() => setDialog("new")}>{t("addAddress")}</Btn>}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map((address) => (
            <article
              key={address.id}
              className={cn(
                "flex flex-col border bg-white p-5",
                address.isDefault ? "border-ink-900" : "border-ink-200",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-[12px] uppercase tracking-[0.16em]">
                  {address.fullName}
                </span>
                {address.isDefault ? (
                  <span className="shrink-0 bg-ink-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-50">
                    {t("default")}
                  </span>
                ) : null}
              </div>

              <address className="mt-4 flex-1 text-[13px] not-italic leading-relaxed text-ink-600">
                {address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-200 pt-4 text-[11px] uppercase tracking-[0.14em]">
                <button
                  type="button"
                  onClick={() => setDialog(address.id)}
                  className="text-ink-700 underline underline-offset-4 transition-colors hover:text-ink-900"
                >
                  {t("edit")}
                </button>

                {!address.isDefault ? (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="text-ink-600 underline underline-offset-4 transition-colors hover:text-ink-900"
                    >
                      {t("makeDefault")}
                    </button>
                  </form>
                ) : null}

                <button
                  type="button"
                  onClick={() => setConfirm(address)}
                  className="ml-auto text-ink-500 underline underline-offset-4 transition-colors hover:text-danger-600"
                >
                  {t("delete")}
                </button>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setDialog("new")}
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-ink-300 p-5 text-ink-500 transition-colors hover:border-ink-900 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="text-[11px] uppercase tracking-[0.16em]">
              {t("addAnother")}
            </span>
          </button>
        </div>
      )}

      {/* new / edit */}
      {dialog ? (
        <Dialog
          label={editing ? t("editAddress") : t("newAddress")}
          closeLabel={t("cancel")}
          onClose={() => setDialog(null)}
          className="max-h-[85%] max-w-lg overflow-auto"
        >
          <DialogHeader
            sticky
            title={editing ? t("editAddress") : t("newAddress")}
            closeLabel={t("cancel")}
            onClose={() => setDialog(null)}
          />
          <form
            action={formAction}
            className="grid gap-x-8 gap-y-7 p-6 sm:grid-cols-2"
          >
            <input type="hidden" name="locale" value={locale} />
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}
            {/* Editing the default must not silently demote it — the flag is
                changed from the card's "Make default", never from this form. */}
            {editing?.isDefault ? (
              <input type="hidden" name="isDefault" value="1" />
            ) : null}

            <Field
              className="sm:col-span-2"
              label={t("field.fullName")}
              name="fullName"
              defaultValue={editing?.fullName ?? ""}
              autoComplete="name"
              required
              error={fieldError("fullName")}
            />
            <SelectField
              label={t("field.country")}
              name="country"
              defaultValue={editing?.country ?? "GE"}
              autoComplete="country"
              error={fieldError("country")}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </SelectField>
            <Field
              label={t("field.city")}
              name="city"
              defaultValue={editing?.city ?? ""}
              autoComplete="address-level2"
              required
              error={fieldError("city")}
            />
            <Field
              className="sm:col-span-2"
              label={t("field.line1")}
              name="line1"
              defaultValue={editing?.line1 ?? ""}
              autoComplete="address-line1"
              required
              error={fieldError("line1")}
            />
            <Field
              className="sm:col-span-2"
              label={t("field.line2")}
              name="line2"
              defaultValue={editing?.line2 ?? ""}
              autoComplete="address-line2"
              placeholder={t("line2Placeholder")}
              optional={t("optional")}
            />
            <Field
              label={t("field.postalCode")}
              name="postalCode"
              defaultValue={editing?.postalCode ?? ""}
              autoComplete="postal-code"
              className="tabular-nums"
            />
            <Field
              label={t("field.phone")}
              name="phone"
              type="tel"
              defaultValue={editing?.phone ?? ""}
              autoComplete="tel"
            />

            <div className="flex justify-end gap-3 border-t border-ink-200 pt-6 sm:col-span-2">
              <Btn variant="ghost" onClick={() => setDialog(null)}>
                {t("cancel")}
              </Btn>
              <Btn type="submit" loading={pending}>
                {editing ? t("saveChanges") : t("addAddress")}
              </Btn>
            </div>
          </form>
        </Dialog>
      ) : null}

      {/* delete confirmation */}
      {confirm ? (
        <Dialog
          label={t("deleteAddressTitle")}
          closeLabel={t("keepIt")}
          onClose={() => setConfirm(null)}
          className="max-w-sm p-6"
        >
          <h2 className="text-lg tracking-[-0.015em]">
            {t("deleteAddressTitle")}
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
            {t("deleteAddressBody")}
          </p>
          <form
            action={deleteAddress}
            onSubmit={() => setConfirm(null)}
            className="mt-7 flex justify-end gap-3"
          >
            <input type="hidden" name="id" value={confirm.id} />
            <input type="hidden" name="locale" value={locale} />
            <Btn variant="ghost" onClick={() => setConfirm(null)}>
              {t("keepIt")}
            </Btn>
            <button
              type="submit"
              className="h-11 bg-danger-600 px-6 text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
            >
              {t("delete")}
            </button>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
