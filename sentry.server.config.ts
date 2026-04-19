// Sentry initialisation for the Node.js server runtime — request handlers,
// server actions, route handlers, API routes. Loaded from instrumentation.ts
// when NEXT_RUNTIME === "nodejs".

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Public DSN — safe to hardcode as a fallback. Override via SENTRY_DSN
  // to point at a different project (sandbox, staging) without a rebuild.
  dsn:
    process.env.SENTRY_DSN ??
    "https://c50822389790565a1a5668cab823b0b7@o4511247363211264.ingest.de.sentry.io/4511247471738960",

  // 100% in dev so we always see what we just wrote; 10% in prod to keep
  // the event budget reasonable. Bump to a dedicated tracesSampler if we
  // ever need per-route precision.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack frames. Server-only; invaluable
  // for debugging "why was this value null here?" without reproducing.
  includeLocalVariables: true,

  enableLogs: true,

  // Compliance SaaS → off by default. Stripping IPs + cookies from events
  // keeps Sentry's role as a processor minimal under GDPR, avoids pulling
  // customer org/product data into the error payload, and matches the
  // privacy policy we ship to customers. Re-enable per-event with
  // Sentry.setUser(...) / setContext(...) inside auth'd request handlers
  // once we have an explicit reason.
  sendDefaultPii: false,

  // VERCEL_ENV is "production" | "preview" | "development" — lets Sentry
  // segment events in the UI instead of mixing preview + prod together.
  environment:
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  // Tie the event to the deployed commit so the stack-trace links resolve
  // to the right code. Vercel injects VERCEL_GIT_COMMIT_SHA on every
  // build; locally it's undefined and Sentry auto-generates a release.
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});
