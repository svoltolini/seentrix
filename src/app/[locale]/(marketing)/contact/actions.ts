"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email/send";

/**
 * Contact / custom-plan enquiry form.
 *
 * Mirrors the newsletter action's defence-in-depth: per-IP rate limit +
 * Cloudflare Turnstile, then a Zod parse. On success it emails the enquiry to
 * the sales inbox via Resend, with `replyTo` set to the submitter so a reply
 * goes straight back to them. If RESEND_API_KEY is unset (dev / pre-launch),
 * sendEmail is a no-op that still returns ok, so the form succeeds locally.
 */

const CONTACT_INBOX = process.env.CONTACT_INBOX ?? "support@seentrix.com";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional().default(""),
  products: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(10).max(4000),
});

export type ContactState =
  | { status: "success" }
  | { status: "error"; message?: string }
  | { status: "rate_limited" }
  | { status: "captcha_failed" }
  | undefined;

export async function submitContactEnquiry(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // 3 enquiries per IP per 10 minutes. The page is public; without this a bot
  // could fan out junk enquiries to the inbox.
  const ip = clientIpFromHeaders(await headers());
  const gate = await rateLimit({
    endpoint: "contact",
    identifier: ip,
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!gate.ok) {
    return { status: "rate_limited" };
  }

  // Human-presence challenge. No-ops in dev when TURNSTILE_SECRET_KEY is unset.
  const captcha = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString(),
    ip,
  );
  if (!captcha.ok) {
    return { status: "captcha_failed" };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    products: formData.get("products"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const { name, email, company, products, message } = parsed.data;

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    products ? `Approx. products: ${products}` : null,
    "",
    "Message:",
    message,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const result = await sendEmail({
    to: CONTACT_INBOX,
    subject: `Custom / Enterprise plan enquiry — ${company || name}`,
    text: lines,
    replyTo: email,
  });

  if (!result.ok) {
    return { status: "error" };
  }

  return { status: "success" };
}
