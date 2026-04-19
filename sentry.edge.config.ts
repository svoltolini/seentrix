// Sentry initialisation for the Edge runtime — middleware, edge route
// handlers, `runtime: "edge"` pages. Loaded from instrumentation.ts when
// NEXT_RUNTIME === "edge". Note: runs both in Vercel Edge and locally.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ??
    "https://c50822389790565a1a5668cab823b0b7@o4511247363211264.ingest.de.sentry.io/4511247471738960",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,

  // See sentry.server.config.ts for the rationale — off by default for the
  // compliance SaaS privacy posture.
  sendDefaultPii: false,

  environment:
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
