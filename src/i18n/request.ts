import { getRequestConfig } from "next-intl/server";

/**
 * English-only request config.
 *
 * Loads every namespace under `messages/en/` and merges it into a single
 * flat dictionary so existing `useTranslations()` / `getTranslations()`
 * callers can resolve any key. The locale is hard-coded to `"en"` —
 * there is no per-request locale negotiation.
 */
export default getRequestConfig(async () => {
  return {
    locale: "en",
    messages: {
      ...(await import("../../messages/en/common.json")).default,
      ...(await import("../../messages/en/dashboard.json")).default,
      ...(await import("../../messages/en/auth.json")).default,
      ...(await import("../../messages/en/assessment.json")).default,
      ...(await import("../../messages/en/checklist.json")).default,
      ...(await import("../../messages/en/products.json")).default,
      ...(await import("../../messages/en/sbom.json")).default,
      ...(await import("../../messages/en/vulnerabilities.json")).default,
      ...(await import("../../messages/en/incidents.json")).default,
      ...(await import("../../messages/en/releases.json")).default,
      ...(await import("../../messages/en/conformity.json")).default,
      ...(await import("../../messages/en/reports.json")).default,
      ...(await import("../../messages/en/public-security.json")).default,
      ...(await import("../../messages/en/entity.json")).default,
      ...(await import("../../messages/en/documents.json")).default,
      ...(await import("../../messages/en/pricing.json")).default,
      ...(await import("../../messages/en/billing.json")).default,
      ...(await import("../../messages/en/upgrade.json")).default,
      ...(await import("../../messages/en/landing.json")).default,
      ...(await import("../../messages/en/blog.json")).default,
      ...(await import("../../messages/en/settings.json")).default,
      ...(await import("../../messages/en/glossary.json")).default,
      ...(await import("../../messages/en/copilot.json")).default,
    },
  };
});
