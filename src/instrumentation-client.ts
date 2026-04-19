// Sentry initialisation for the browser runtime. Runs in every page load
// and hooks App Router navigation transitions for client-side spans.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://c50822389790565a1a5668cab823b0b7@o4511247363211264.ingest.de.sentry.io/4511247471738960",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,

  // Session Replay — privacy-first. We never passively record a session
  // (rate 0), only capture the buffered replay when an error fires (rate
  // 1.0). Text + media are masked + blocked by default so CRA form data
  // (legal names, VAT numbers, contact details) never reaches Sentry.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Noise filter — ResizeObserver and "Non-Error promise rejection
  // captured" come from browser extensions and give us nothing actionable.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
  ],

  // See sentry.server.config.ts for the rationale — off by default.
  sendDefaultPii: false,

  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development",
});

// App Router navigation hook — emits a client span when a route transition
// starts so we can see `/app/dashboard → /app/products` latency in traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
