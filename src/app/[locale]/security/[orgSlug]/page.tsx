import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSecurityPage } from "./public-security-page";

export default async function PublicSecurityIndex({
  params,
}: {
  params: Promise<{ locale: string; orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  // Anonymous can read org name + security fields if we select only those
  // columns and the org has enabled the public page.
  const { data } = await supabase
    .from("organizations")
    .select(
      "name, slug, security_contact_email, security_policy, security_public_enabled",
    )
    .eq("slug", orgSlug)
    .eq("security_public_enabled", true)
    .single();

  if (!data) notFound();

  return (
    <PublicSecurityPage
      orgName={(data as { name: string }).name}
      orgSlug={orgSlug}
      contactEmail={
        (data as { security_contact_email: string | null })
          .security_contact_email
      }
      policy={(data as { security_policy: string | null }).security_policy}
    />
  );
}
