import { NextResponse } from "next/server";

/**
 * CSP violation collector.
 *
 * Browsers POST a JSON report to this endpoint whenever the
 * `Content-Security-Policy-Report-Only` header (set in next.config.ts)
 * detects something the policy would have blocked. We're in report-only
 * mode for now so nothing is enforced — the goal of this endpoint is
 * to surface what would break when we flip to enforce.
 *
 * Two report formats exist in the wild:
 *   - "csp-report"  — older Chrome/Edge/Safari (`{ "csp-report": { ... } }`)
 *   - "csp-violation" — newer Reporting API (`[{ "type": "csp-violation", ... }]`)
 *
 * Both arrive as a content-type the body parser may not enable by
 * default, so we read raw text and parse defensively.
 *
 * Output goes to `console.warn` so it lands in Vercel runtime logs.
 * Sentry pickup happens automatically via `console.warn` instrumentation
 * when configured. We deliberately do not 4xx malformed payloads — a
 * misbehaving browser sending garbage shouldn't fill the error budget.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  // Normalise to a flat object regardless of which envelope the browser used.
  let report: unknown = body;
  if (
    body &&
    typeof body === "object" &&
    "csp-report" in (body as Record<string, unknown>)
  ) {
    report = (body as Record<string, unknown>)["csp-report"];
  } else if (Array.isArray(body) && body[0]?.body) {
    report = body[0].body;
  }

  console.warn("[csp-report]", {
    userAgent: req.headers.get("user-agent"),
    referer: req.headers.get("referer"),
    report,
  });

  // The browser ignores the response body; 204 keeps the wire quiet.
  return new NextResponse(null, { status: 204 });
}

// Some browsers send a CORS preflight before posting — accept it without
// inspection since the body is opaque-blocked anyway.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
