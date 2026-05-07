"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

const emailSchema = z.object({
  email: z.string().email(),
});

export type NewsletterState =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "duplicate" }
  | { status: "rate_limited" }
  | undefined;

export async function subscribeNewsletter(
  _prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  // 3 signups per IP per 10 minutes — the landing page is public; a bot
  // hammering it can otherwise fill the subscribers table with garbage.
  const ip = clientIpFromHeaders(await headers());
  const gate = await rateLimit({
    endpoint: "newsletter",
    identifier: ip,
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!gate.ok) {
    return { status: "rate_limited" };
  }

  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid email address." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    locale: "en",
    source: "landing_page",
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "duplicate" };
    }
    return { status: "error", message: "Something went wrong." };
  }

  return { status: "success" };
}
