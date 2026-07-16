import { useTranslations } from "next-intl";

import { logoutAction } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";

/**
 * Server-action logout. Rendered as a tiny form so it works without client JS;
 * placed in the header shell in T1.11.
 */
export function LogoutButton() {
  const t = useTranslations("Auth");
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        {t("logout")}
      </Button>
    </form>
  );
}
