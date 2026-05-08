import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Pin Turbopack's workspace root to this project dir. Without this, the
// presence of `.claude/worktrees/<branch>/package-lock.json` (Claude Code
// git worktrees living inside the repo) confuses Turbopack into also
// compiling the stale worktree tree, which explodes on any file that
// exists on main but not on the worktree's older branch.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/**
 * Security headers applied to every response.
 *
 * - Strict-Transport-Security: force HTTPS for 2 years, including subdomains.
 *   includeSubDomains is safe because we only have one apex.
 * - X-Frame-Options DENY: blocks the entire app from being framed —
 *   prevents clickjacking the auth + MFA challenge surfaces.
 * - X-Content-Type-Options nosniff: belt-and-braces against MIME sniffing.
 * - Referrer-Policy strict-origin-when-cross-origin: leaks origin, not path,
 *   to third-party links. Same default Vercel uses.
 * - Permissions-Policy: explicitly disable hardware APIs we never use.
 * - Cross-Origin-Opener-Policy same-origin: hardens against
 *   tabnabbing / Spectre-style cross-origin attacks.
 *
 * Plus a Content-Security-Policy in REPORT-ONLY mode (see CSP_REPORT_ONLY
 * below). Browsers will surface violations to /api/csp-report without
 * blocking anything yet — once the report stream is quiet for a few
 * days we flip the header name to enforce.
 */

// Hosts the app legitimately talks to. Kept as named constants so the
// CSP directives below stay readable.
const SUPABASE = "https://*.supabase.co";
const SENTRY = "https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io";
const STRIPE_JS = "https://js.stripe.com";
const STRIPE_API = "https://api.stripe.com";
const STRIPE_CHECKOUT = "https://checkout.stripe.com";
const TURNSTILE = "https://challenges.cloudflare.com";

/**
 * Strict-ish CSP. `'unsafe-inline'` on script-src is intentional: Next
 * injects inline bootstrap scripts and migrating those to per-request
 * nonces is a separate piece of work. Report-only mode means this won't
 * block anything until we explicitly enforce — but anything served from
 * an unexpected origin (e.g. a typoscript that loads from evil.example)
 * will fire a violation report we can investigate.
 */
const CSP_REPORT_ONLY = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${STRIPE_JS} ${TURNSTILE}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${SUPABASE}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${SUPABASE} ${SENTRY} ${STRIPE_API} ${TURNSTILE}`,
  `frame-src 'self' ${STRIPE_JS} ${STRIPE_CHECKOUT} ${TURNSTILE}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' ${STRIPE_CHECKOUT}`,
  // `frame-ancestors 'none'` is functionally redundant with
  // `X-Frame-Options: DENY` but recommended for browsers that prefer CSP.
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
  `report-uri /api/csp-report`,
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "accfirbiiejappwqpvwx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "seentrix",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
