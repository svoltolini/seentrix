"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganization, type OrgSettings, type TeamMember } from "../actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";
import { FieldHelp } from "@/components/field-help";
import { useGlossaryTags } from "@/components/glossary/use-glossary-tags";
import { PLAN_USER_LIMITS, type OrgPlan } from "@/lib/constants/plans";
import { DangerZone } from "./danger-zone";
import type { DeletionStatus } from "../gdpr-types";

// Role hierarchy from highest to lowest
const ROLE_HIERARCHY: { key: string; color: string; bg: string; icon: string }[] = [
  { key: "admin", color: "text-primary", bg: "bg-primary", icon: "crown-stroke-rounded" },
  { key: "cto", color: "text-accent", bg: "bg-accent", icon: "terminal-stroke-rounded" },
  { key: "compliance_officer", color: "text-accent", bg: "bg-accent", icon: "task-done-02-stroke-rounded" },
  { key: "editor", color: "text-[#FF9E55]", bg: "bg-[#FF9E55]", icon: "pencil-edit-02-stroke-rounded" },
  { key: "viewer", color: "text-muted-foreground", bg: "bg-muted-foreground", icon: "glasses-stroke-rounded" },
];

export function OrgSettingsContent({
  org,
  members,
  isAdmin,
  deletion,
}: {
  org: OrgSettings | null;
  members: TeamMember[];
  isAdmin: boolean;
  deletion: DeletionStatus | null;
}) {
  const t = useTranslations("settings.organization");
  const tTeam = useTranslations("settings.team");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Shortcut: resolve title/body/reference for a FieldHelp from settings.json
  // under the `tooltips.<key>` namespace. Body + reference go through t.rich
  // with the full glossary-tag renderer so translators can wrap any jargon
  // word in <g-doc>…</g-doc>, <g-annex_v>…</g-annex_v>, etc. and the
  // rendered output has a dotted-underline Term that opens the glossary.
  const glossary = useGlossaryTags();
  const tip = (key: string) => ({
    title: t(`tooltips.${key}.title`),
    body: t.rich(`tooltips.${key}.body`, glossary),
    reference: t.rich(`tooltips.${key}.ref`, glossary),
  });

  const [name, setName] = useState(org?.name ?? "");
  const [addressLine1, setAddressLine1] = useState(org?.address_line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(org?.address_line2 ?? "");
  const [postalCode, setPostalCode] = useState(org?.postal_code ?? "");
  const [city, setCity] = useState(org?.city ?? "");
  const [country, setCountry] = useState(org?.country ?? "");
  const [legalName, setLegalName] = useState(org?.legal_name ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(
    org?.registration_number ?? "",
  );
  const [signatoryName, setSignatoryName] = useState(
    org?.signatory_name ?? "",
  );
  const [signatoryPosition, setSignatoryPosition] = useState(
    org?.signatory_position ?? "",
  );
  const [contactEmail, setContactEmail] = useState(org?.contact_email ?? "");
  const [website, setWebsite] = useState(org?.website ?? "");

  // Read-only by default. The org's legal identity feeds the Declaration of
  // Conformity, so an accidental edit by anyone with access is risky — the
  // whole form sits behind an explicit "Edit" gate. Toggling on enables every
  // field; Cancel restores the last-saved values; Save persists + locks again.
  const [isEditing, setIsEditing] = useState(false);
  const editable = isAdmin && isEditing;

  function resetToSaved() {
    setName(org?.name ?? "");
    setAddressLine1(org?.address_line1 ?? "");
    setAddressLine2(org?.address_line2 ?? "");
    setPostalCode(org?.postal_code ?? "");
    setCity(org?.city ?? "");
    setCountry(org?.country ?? "");
    setLegalName(org?.legal_name ?? "");
    setRegistrationNumber(org?.registration_number ?? "");
    setSignatoryName(org?.signatory_name ?? "");
    setSignatoryPosition(org?.signatory_position ?? "");
    setContactEmail(org?.contact_email ?? "");
    setWebsite(org?.website ?? "");
  }

  function cancelEdit() {
    resetToSaved();
    setIsEditing(false);
  }

  // Fields mandatory for DoC issuance; shown inline so users know why.
  const docReadyFields: { key: string; value: string }[] = [
    { key: "legalName", value: legalName },
    { key: "registrationNumber", value: registrationNumber },
    { key: "addressLine1", value: addressLine1 },
    { key: "postalCode", value: postalCode },
    { key: "city", value: city },
    { key: "country", value: country },
    { key: "signatoryName", value: signatoryName },
    { key: "signatoryPosition", value: signatoryPosition },
    { key: "contactEmail", value: contactEmail },
  ];
  const missingForDoc = docReadyFields.filter((f) => !f.value.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !isEditing) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("address_line1", addressLine1);
    formData.set("address_line2", addressLine2);
    formData.set("postal_code", postalCode);
    formData.set("city", city);
    formData.set("country", country);
    formData.set("legal_name", legalName);
    formData.set("registration_number", registrationNumber);
    formData.set("signatory_name", signatoryName);
    formData.set("signatory_position", signatoryPosition);
    formData.set("contact_email", contactEmail);
    formData.set("website", website);

    startTransition(async () => {
      const result = await updateOrganization(formData);
      if (result?.error) {
        toast({ type: "error", message: t("error") });
      } else {
        toast({ type: "success", message: t("saved") });
        setIsEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Read-only banner for non-admins */}
      {!isAdmin && (
        <div className="rounded-md bg-muted px-4 py-3 text-center text-p3 text-muted-foreground">
          {t("readOnly")}
        </div>
      )}

      {/* General */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-md bg-card shadow-card-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-h4 text-foreground">{t("title")}</h2>
              {isAdmin && !isEditing && (
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted px-2 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground">
                  <Icon name="lock-password-stroke-rounded" size={12} />
                  {t.has("readOnlyBadge") ? t("readOnlyBadge") : "Locked"}
                </span>
              )}
            </div>
            {/* Edit gate — the whole form is read-only until the admin opts in,
                so a stray click can't overwrite DoC-critical legal details. */}
            {isAdmin && !isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Icon name="pencil-edit-02-stroke-rounded" size={15} />
                {t.has("editDetails") ? t("editDetails") : "Edit details"}
              </Button>
            )}
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="name">
                {t("nameLabel")}
                <FieldHelp {...tip("name")} />
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                disabled={!editable}
                required
              />
            </div>

          </div>
        </div>

        {/* DoC-readiness banner — mirrors the Action Needed card style */}
        {isAdmin && missingForDoc.length > 0 && (
          <ProfileIncompleteBanner
            eyebrow={t("docReady.eyebrow")}
            title={t("docReady.title")}
            description={t("docReady.description", {
              count: missingForDoc.length,
            })}
            cta={t("docReady.cta")}
            variant="inline"
          />
        )}

        {/* Legal entity (CRA-mandatory) */}
        <div className="rounded-md bg-card shadow-card-lg">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-h4 text-foreground">{t("legalTitle")}</h2>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("legalDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="legal_name">
                {t("legalName")}
                <FieldHelp {...tip("legalName")} />
              </Label>
              <Input
                id="legal_name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder={t("legalNamePlaceholder")}
                disabled={!editable}
              />
              <p className="text-p4 text-muted-foreground">
                {t("legalNameHint")}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="registration_number">
                {t("registrationNumber")}
                <FieldHelp {...tip("registrationNumber")} />
              </Label>
              <Input
                id="registration_number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder={t("registrationNumberPlaceholder")}
                disabled={!editable}
              />
              <p className="text-p4 text-muted-foreground">
                {t("registrationNumberHint")}
              </p>
            </div>
          </div>
        </div>

        {/* Signatory + public contact */}
        <div className="rounded-md bg-card shadow-card-lg">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-h4 text-foreground">{t("signatoryTitle")}</h2>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("signatoryDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="signatory_name">
                  {t("signatoryName")}
                  <FieldHelp {...tip("signatoryName")} />
                </Label>
                <Input
                  id="signatory_name"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder={t("signatoryNamePlaceholder")}
                  disabled={!editable}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="signatory_position">
                  {t("signatoryPosition")}
                  <FieldHelp {...tip("signatoryPosition")} />
                </Label>
                <Input
                  id="signatory_position"
                  value={signatoryPosition}
                  onChange={(e) => setSignatoryPosition(e.target.value)}
                  placeholder={t("signatoryPositionPlaceholder")}
                  disabled={!editable}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="contact_email">
                  {t("contactEmail")}
                  <FieldHelp {...tip("contactEmail")} />
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  disabled={!editable}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="website">
                  {t("website")}
                  <FieldHelp {...tip("website")} />
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  disabled={!editable}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-md bg-card shadow-card-lg">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-h4 text-foreground">{t("addressTitle")}</h2>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("addressDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="address_line1">
                {t("addressLine1")}
                <FieldHelp {...tip("addressLine1")} />
              </Label>
              <Input
                id="address_line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder={t("addressLine1Placeholder")}
                disabled={!editable}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="address_line2">
                {t("addressLine2")}
                <FieldHelp {...tip("addressLine2")} />
              </Label>
              <Input
                id="address_line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder={t("addressLine2Placeholder")}
                disabled={!editable}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="postal_code">
                  {t("postalCode")}
                  <FieldHelp {...tip("postalCode")} />
                </Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t("postalCodePlaceholder")}
                  disabled={!editable}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label size="lg" htmlFor="city">
                  {t("city")}
                  <FieldHelp {...tip("city")} />
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                  disabled={!editable}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="country">
                {t("country")}
                <FieldHelp {...tip("country")} />
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t("countryPlaceholder")}
                disabled={!editable}
              />
            </div>
          </div>
        </div>

        {/* Save / Cancel — only while editing. The sticky-feeling bar keeps the
            two actions together so the user always has an obvious way out
            without saving. */}
        {isAdmin && isEditing && (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={isPending}
            >
              {t.has("cancel") ? t("cancel") : "Cancel"}
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </form>

      {/* Organization chart — role-tier board */}
      <OrganizationChart
        plan={org?.plan ?? "free"}
        members={members}
        isAdmin={isAdmin}
        t={t}
        tTeam={tTeam}
      />

      {/* Danger zone — GDPR data rights. Admin-only; stays mounted so the
          pending-deletion banner is always visible to anyone with the link. */}
      {isAdmin && org && (
        <DangerZone orgName={org.name} orgId={org.id} deletion={deletion} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organization chart — role-tier board.
//
// Redesigned from the old vertical-trunk tree into a clean tier board: a
// summary header with the total head-count + a seat-capacity meter, then one
// rounded "lane" per CRA role. Each lane carries a colored accent rail, a role
// badge with its head-count, and the members as compact avatar chips that flow
// horizontally. Empty roles show a dashed "Invite a <role>" chip for admins or
// a muted "No one yet" for everyone else. The whole thing reads at a glance and
// scales cleanly from one person to a full org.
// ---------------------------------------------------------------------------

function OrganizationChart({
  plan,
  members,
  isAdmin,
  t,
  tTeam,
}: {
  plan: OrgPlan;
  members: TeamMember[];
  isAdmin: boolean;
  t: ReturnType<typeof useTranslations>;
  tTeam: ReturnType<typeof useTranslations>;
}) {
  const used = members.length;
  const limit = PLAN_USER_LIMITS[plan];
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const nearCap = !unlimited && used / limit >= 0.8;
  const atCap = !unlimited && used >= limit;
  const capacityColor = atCap
    ? "var(--destructive)"
    : nearCap
      ? "var(--warning)"
      : "var(--primary)";

  const tiers = ROLE_HIERARCHY.map((tier) => ({
    ...tier,
    members: members.filter((m) => m.role === tier.key),
  }));

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card-lg">
      {/* Header — title + total head-count + capacity meter */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-h4 text-foreground">{t("orgChart")}</h2>
            <p className="mt-0.5 text-p3 text-muted-foreground">
              {t("orgChartDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
            <Icon
              name="Profile2User"
              size={16}
              className="text-muted-foreground"
            />
            <span className="text-l6 tabular-nums text-foreground">
              {t("orgChartTotalMembers", { count: used })}
            </span>
          </div>
        </div>

        {/* Capacity meter */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-l6-plus uppercase tracking-wide text-muted-foreground">
              {t("orgChartCapacity")}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-p4 tabular-nums text-muted-foreground">
                {unlimited
                  ? t("seatsUsedUnlimited", { count: used })
                  : t("seatsUsed", { count: used, limit })}
              </span>
              {isAdmin && !unlimited && nearCap && (
                <Link
                  href="/app/settings/billing"
                  className="text-l6 text-primary hover:underline"
                >
                  {t("upgrade")}
                </Link>
              )}
            </div>
          </div>
          {!unlimited && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-border">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: capacityColor }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Role lanes */}
      <div className="divide-y divide-border">
        {tiers.map((tier) => (
          <RoleLane
            key={tier.key}
            tier={tier}
            isAdmin={isAdmin}
            roleLabel={tTeam(
              `roles.${tier.key}` as Parameters<typeof tTeam>[0],
            )}
            countLabel={
              tier.members.length === 1
                ? tTeam("memberCount", { count: tier.members.length })
                : tTeam("memberCountPlural", { count: tier.members.length })
            }
            inviteLabel={t("inviteToRole", {
              role: tTeam(`roles.${tier.key}` as Parameters<typeof tTeam>[0]),
            })}
            emptyLabel={t("noOneYet")}
          />
        ))}
      </div>
    </div>
  );
}

function RoleLane({
  tier,
  isAdmin,
  roleLabel,
  countLabel,
  inviteLabel,
  emptyLabel,
}: {
  tier: (typeof ROLE_HIERARCHY)[number] & { members: TeamMember[] };
  isAdmin: boolean;
  roleLabel: string;
  countLabel: string;
  inviteLabel: string;
  emptyLabel: string;
}) {
  const hex = tier.bg.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? null;
  const isEmpty = tier.members.length === 0;

  return (
    <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
      {/* Accent rail — a slim colored bar pinned to the lane's left edge. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-sm",
          hex ? "" : tier.bg,
        )}
        style={hex ? { backgroundColor: hex } : undefined}
      />

      {/* Role identity — fixed-width column so the member chips align. */}
      <div className="flex shrink-0 items-center gap-3 sm:w-56">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-card-sm",
            hex ? "" : tier.bg,
          )}
          style={hex ? { backgroundColor: hex } : undefined}
        >
          <Icon name={tier.icon} size={18} />
        </div>
        <div className="min-w-0">
          <p
            className="text-l5"
            style={{ color: hex ?? undefined }}
            // Fall back to the tier color class when there's no hex match
            // (the Tailwind token roles use class-based colors).
          >
            <span className={hex ? "" : tier.color}>{roleLabel}</span>
          </p>
          <p className="mt-0.5 text-p4 tabular-nums text-muted-foreground">
            {countLabel}
          </p>
        </div>
      </div>

      {/* Members — avatar chips that flow horizontally and wrap. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {tier.members.map((member) => (
          <Link
            key={member.id}
            href="/app/settings/team"
            className="group flex items-center gap-2.5 rounded-full border border-border-outline bg-card py-1 pl-1 pr-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-sm"
          >
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-l6-plus text-muted-foreground">
              {member.avatar_url ? (
                // Tiny remote avatar from Supabase storage — next/image
                // optimization isn't worth the cost for a 32px chip.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                (member.full_name ?? member.email).charAt(0).toUpperCase()
              )}
            </span>
            <span className="truncate text-l6 text-foreground group-hover:text-primary">
              {member.full_name ?? member.email}
            </span>
          </Link>
        ))}

        {isEmpty &&
          (isAdmin ? (
            <Link
              href="/app/settings/team"
              className="flex items-center gap-2 rounded-full border border-dashed px-3.5 py-2 transition-colors hover:bg-muted/60"
              style={{ borderColor: hex ? `${hex}55` : undefined }}
            >
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: hex ? `${hex}25` : undefined,
                  color: hex ?? undefined,
                }}
              >
                <Icon name="add-01" size={12} />
              </span>
              <span
                className="text-l6"
                style={{ color: hex ?? undefined }}
              >
                {inviteLabel}
              </span>
            </Link>
          ) : (
            <span className="rounded-full border border-dashed border-border-outline px-3.5 py-2 text-p4 text-muted-foreground">
              {emptyLabel}
            </span>
          ))}
      </div>
    </div>
  );
}
