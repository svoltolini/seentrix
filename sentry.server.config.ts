// Sentry server-side (Node runtime) initialisation — catches errors thrown
// inside server components, server actions, and route handlers.
//
// Activates only when SENTRY_DSN is configured.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? "development",
  });
}
