"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.string().email(),
});

export type NewsletterState =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "duplicate" }
  | undefined;

export async function subscribeNewsletter(
  _prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid email address." };
  }

  const locale = (formData.get("locale") as string) || "en";

  const supabase = await createClient();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: parsed.data.email,
    locale,
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
