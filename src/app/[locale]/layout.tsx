import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CookieConsent } from "@/components/cookie-consent";

/**
 * Locale layout.
 *
 * With `localePrefix: "never"` the active language is negotiated per-request
 * from the `NEXT_LOCALE` cookie (set by the language picker / middleware), NOT
 * from a URL segment. We therefore read the resolved locale via `getLocale()`
 * (which reflects that negotiation) rather than from `params.locale`, and we do
 * NOT call `setRequestLocale` / `generateStaticParams` — those statically
 * pin a page to one locale at build time, which would make runtime
 * cookie-based switching impossible. The whole `[locale]` tree is already
 * effectively dynamic (auth/cookies), so rendering per-request is correct.
 */
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <CookieConsent />
    </NextIntlClientProvider>
  );
}
