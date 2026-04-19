// Sentry browser-side initialisation.
//
// Activates only when SENTRY_DSN is configured — no DSN, no-op. Safe to
// commit and safe to deploy before the Sentry project is created.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Low sample rate to stay under the free tier. Bump when we have budget.
    tracesSampleRate: 0.1,
    // Don't capture routine replay; only on errors.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Strip noisy browser extensions that throw non-actionable errors.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}
