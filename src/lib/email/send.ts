import { Resend } from "resend";

/**
 * Transactional email helper.
 *
 * Activates only when RESEND_API_KEY is configured — if absent, sendEmail
 * is a no-op that logs in development mode. Safe to deploy before the
 * Resend account is provisioned.
 *
 * For Supabase Auth flows (password reset, email confirmation) this is
 * NOT used — configure Supabase's SMTP integration to point at Resend
 * directly from the Supabase dashboard. This helper is for application-
 * level emails like "a team member invited you," "an incident requires
 * your attention," or weekly digests.
 */

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.RESEND_FROM_ADDRESS ?? "Seentrix <no-reply@seentrix.app>";

const client = apiKey ? new Resend(apiKey) : null;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  /** Preferred. A React component rendered via @react-email. */
  react?: React.ReactElement;
  /** Fallback. Plain text body. */
  text?: string;
  /** Fallback. Pre-rendered HTML body. */
  html?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}> {
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] RESEND_API_KEY missing — skipping send", {
        to: input.to,
        subject: input.subject,
      });
    }
    return { ok: true, skipped: true };
  }

  const { data, error } = await client.emails.send({
    from: fromAddress,
    to: input.to,
    subject: input.subject,
    react: input.react,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  } as Parameters<typeof client.emails.send>[0]);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}
