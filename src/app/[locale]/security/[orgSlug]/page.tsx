import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUsePsirt, type OrgPlan } from "@/lib/constants/plans";
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
      "name, slug, security_contact_email, security_policy, security_public_enabled, plan",
    )
    .eq("slug", orgSlug)
    .eq("security_public_enabled", true)
    .single();

  if (!data) notFound();

  // Plan gate: the public PSIRT page is Business+. Hide it if the org's plan
  // no longer qualifies (e.g. enabled then downgraded).
  const plan = ((data as { plan?: string }).plan ?? "free") as OrgPlan;
  if (!canUsePsirt(plan)) notFound();

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
