import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { hasLocale } from "next-intl";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/common.json`)).default,
      ...(await import(`../../messages/${locale}/dashboard.json`)).default,
      ...(await import(`../../messages/${locale}/auth.json`)).default,
      ...(await import(`../../messages/${locale}/assessment.json`)).default,
      ...(await import(`../../messages/${locale}/checklist.json`)).default,
      ...(await import(`../../messages/${locale}/products.json`)).default,
      ...(await import(`../../messages/${locale}/sbom.json`)).default,
      ...(await import(`../../messages/${locale}/vulnerabilities.json`)).default,
      ...(await import(`../../messages/${locale}/documents.json`)).default,
      ...(await import(`../../messages/${locale}/pricing.json`)).default,
      ...(await import(`../../messages/${locale}/billing.json`)).default,
      ...(await import(`../../messages/${locale}/upgrade.json`)).default,
      ...(await import(`../../messages/${locale}/landing.json`)).default,
      ...(await import(`../../messages/${locale}/blog.json`)).default,
      ...(await import(`../../messages/${locale}/settings.json`)).default,
    },
  };
});
