import { SiteChrome } from "@/components/layout/site-chrome";

/**
 * Sign-in and registration keep the shop's chrome: someone who came here from a
 * product page needs the way back, and the bag has to stay reachable so signing
 * in mid-checkout does not feel like leaving the shop.
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <SiteChrome locale={locale} footer="slim" announcement={false}>
      {children}
    </SiteChrome>
  );
}
