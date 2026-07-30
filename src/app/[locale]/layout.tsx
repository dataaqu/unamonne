import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_Georgian } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { BrandLoader } from "@/components/layout/brand-loader";
import { JsonLd } from "@/components/seo/json-ld";
import { routing } from "@/i18n/routing";
import { BRAND } from "@/lib/brand";
import { appUrl } from "@/lib/email/client";
import { organizationJsonLd } from "@/lib/seo/jsonld";
import "../globals.css";

/**
 * Helvetica Neue carries the Latin type (a system face, so nothing to load);
 * Georgian falls through to Noto Sans Georgian, and numerals in code-like
 * positions (order ids, SKUs) use IBM Plex Mono. See the `--font-sans` /
 * `--font-mono` stacks in globals.css.
 */
const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Pre-render both locales at build time. Because every route lives under
 * `[locale]`, this file is the app's root layout (Next.js 16 allows the root
 * layout to live in a dynamic segment).
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(appUrl()),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    openGraph: {
      siteName: t("title"),
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate the incoming `[locale]` segment and enable static rendering.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${notoGeorgian.variable} ${plexMono.variable} h-full`}
      // The loader's pre-paint script stamps `data-loader` here before React
      // hydrates, which is the whole point of it — the attribute has to exist
      // before the first frame, so it can never match the server HTML.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-ink-100 text-ink-900">
        <JsonLd data={organizationJsonLd({ name: BRAND.name, url: appUrl() })} />
        {/* Server-rendered, so the panel is painted with the first frame and
            the shop is never seen half-dressed underneath it. */}
        <BrandLoader />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
