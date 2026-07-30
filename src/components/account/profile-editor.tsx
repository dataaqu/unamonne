"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AccountHeader } from "@/components/account/account-header";
import { Btn } from "@/components/ui/btn";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useRouter } from "@/i18n/navigation";
import type { AccountFormState } from "@/lib/account/form";
import { updateProfileAction } from "@/lib/account/profile-actions";

/**
 * The profile masthead and the panel behind "Edit profile". Both live in one
 * client component because the confirmation the save leaves behind belongs
 * above the details list, not inside the panel that has just closed.
 */
export function ProfileEditor({
  title,
  meta,
  name,
  phone,
}: {
  title: string;
  meta: string;
  name: string;
  phone: string;
}) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Closing and the confirmation belong to the submission, not to a render:
  // the panel shuts once the write has actually landed, never before.
  const [state, formAction, pending] = useActionState(
    async (prev: AccountFormState | undefined, formData: FormData) => {
      const result = await updateProfileAction(prev, formData);
      if (result.ok) {
        setOpen(false);
        setSaved(true);
        // The details list below is server-rendered from the user row.
        router.refresh();
      }
      return result;
    },
    { ok: false },
  );

  return (
    <>
      <AccountHeader
        title={title}
        meta={meta}
        action={
          <Btn variant="outline" onClick={() => setOpen(true)}>
            {t("editProfile")}
          </Btn>
        }
      />

      {saved ? (
        <Notice role="status" className="mt-6">
          {t("profileUpdated")}
        </Notice>
      ) : null}

      {open ? (
        <Dialog
          label={t("editProfile")}
          closeLabel={t("cancel")}
          onClose={() => setOpen(false)}
          className="max-w-md"
        >
          <DialogHeader
            title={t("editProfile")}
            closeLabel={t("cancel")}
            onClose={() => setOpen(false)}
          />
          <form action={formAction} className="space-y-7 p-6">
            <input type="hidden" name="locale" value={locale} />
            <Field
              label={t("name")}
              name="name"
              defaultValue={name}
              autoComplete="name"
              required
              error={
                state.fieldErrors?.name?.length ? t("required") : undefined
              }
            />
            <Field
              label={t("field.phone")}
              name="phone"
              type="tel"
              defaultValue={phone}
              autoComplete="tel"
            />
            <p className="text-xs text-ink-500">{t("emailByHand")}</p>
            <div className="flex justify-end gap-3">
              <Btn variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Btn>
              <Btn type="submit" loading={pending}>
                {pending ? t("saving") : t("save")}
              </Btn>
            </div>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
