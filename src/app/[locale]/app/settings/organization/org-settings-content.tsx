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
import { HugeIcon } from "@/components/huge-icon";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";
import { PLAN_USER_LIMITS, type OrgPlan } from "@/lib/constants/plans";

// Role hierarchy from highest to lowest
const ROLE_HIERARCHY: { key: string; color: string; bg: string; icon: string }[] = [
  { key: "admin", color: "text-[#2563EB]", bg: "bg-[#2563EB]", icon: "crown-stroke-rounded" },
  { key: "cto", color: "text-[#EA580C]", bg: "bg-[#EA580C]", icon: "terminal-stroke-rounded" },
  { key: "compliance_officer", color: "text-[#7C3AED]", bg: "bg-[#7C3AED]", icon: "task-done-02-stroke-rounded" },
  { key: "editor", color: "text-[#0891B2]", bg: "bg-[#0891B2]", icon: "pencil-edit-02-stroke-rounded" },
  { key: "viewer", color: "text-[#94A3B8]", bg: "bg-[#94A3B8]", icon: "glasses-stroke-rounded" },
];

export function OrgSettingsContent({
  org,
  members,
  isAdmin,
}: {
  org: OrgSettings | null;
  members: TeamMember[];
  isAdmin: boolean;
}) {
  const t = useTranslations("settings.organization");
  const tTeam = useTranslations("settings.team");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(org?.name ?? "");
  const [language, setLanguage] = useState(org?.language ?? "en");
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
    if (!isAdmin) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("language", language);
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
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Read-only banner for non-admins */}
      {!isAdmin && (
        <div className="rounded-lg bg-white/[0.03] px-4 py-3 text-center text-xs text-muted-foreground">
          {t("readOnly")}
        </div>
      )}

      {/* General */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-card">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold">{t("title")}</h2>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                disabled={!isAdmin}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("languageLabel")}</Label>
              <p className="text-xs text-muted-foreground/60">
                {t("languageDescription")}
              </p>
              <div className="flex gap-2">
                {(["en", "de"] as const).map((lang) => (
                  <label
                    key={lang}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm font-medium transition-all has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5",
                      isAdmin ? "cursor-pointer" : "cursor-default opacity-60"
                    )}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang}
                      checked={language === lang}
                      onChange={() => isAdmin && setLanguage(lang)}
                      disabled={!isAdmin}
                      className="sr-only"
                    />
                    {lang === "en" ? "English" : "Deutsch"}
                  </label>
                ))}
              </div>
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
        <div className="rounded-xl bg-card">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold">{t("legalTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t("legalDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="legal_name">{t("legalName")}</Label>
              <Input
                id="legal_name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder={t("legalNamePlaceholder")}
                disabled={!isAdmin}
              />
              <p className="text-[11px] text-muted-foreground/60">
                {t("legalNameHint")}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registration_number">
                {t("registrationNumber")}
              </Label>
              <Input
                id="registration_number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder={t("registrationNumberPlaceholder")}
                disabled={!isAdmin}
              />
              <p className="text-[11px] text-muted-foreground/60">
                {t("registrationNumberHint")}
              </p>
            </div>
          </div>
        </div>

        {/* Signatory + public contact */}
        <div className="rounded-xl bg-card">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold">{t("signatoryTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t("signatoryDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signatory_name">{t("signatoryName")}</Label>
                <Input
                  id="signatory_name"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder={t("signatoryNamePlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signatory_position">
                  {t("signatoryPosition")}
                </Label>
                <Input
                  id="signatory_position"
                  value={signatoryPosition}
                  onChange={(e) => setSignatoryPosition(e.target.value)}
                  placeholder={t("signatoryPositionPlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact_email">{t("contactEmail")}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="website">{t("website")}</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl bg-card">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold">{t("addressTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t("addressDescription")}
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line1">{t("addressLine1")}</Label>
              <Input
                id="address_line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder={t("addressLine1Placeholder")}
                disabled={!isAdmin}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line2">{t("addressLine2")}</Label>
              <Input
                id="address_line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder={t("addressLine2Placeholder")}
                disabled={!isAdmin}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="postal_code">{t("postalCode")}</Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t("postalCodePlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">{t("city")}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">{t("country")}</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t("countryPlaceholder")}
                disabled={!isAdmin}
              />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </form>

      {/* Organization chart — vertical tree */}
      <OrganizationChart
        orgName={org?.legal_name ?? org?.name ?? ""}
        plan={org?.plan ?? "free"}
        members={members}
        isAdmin={isAdmin}
        t={t}
        tTeam={tTeam}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organization chart — vertical tree.
// Root node is the org itself (with plan badge); a solid vertical spine
// descends from the root and branches right into a box per CRA role. Inside
// each role box the members sit as avatar rows, also connected back to the
// spine with a small horizontal stub. Empty roles show a dashed "Invite a
// <role>" branch for admins, or a muted "No one yet" for everyone else.
// ---------------------------------------------------------------------------

function OrganizationChart({
  orgName,
  plan,
  members,
  isAdmin,
  t,
  tTeam,
}: {
  orgName: string;
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
    ? "#DC2626"
    : nearCap
      ? "#D97706"
      : "#16A34A";

  const tiers = ROLE_HIERARCHY.map((tier) => ({
    ...tier,
    members: members.filter((m) => m.role === tier.key),
  }));

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t("orgChart")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t("orgChartDescription")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {unlimited
                ? t("seatsUsedUnlimited", { count: used })
                : t("seatsUsed", { count: used, limit })}
            </span>
            {isAdmin && !unlimited && nearCap && (
              <Link
                href="/app/settings/billing"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("upgrade")}
              </Link>
            )}
          </div>
        </div>
        {!unlimited && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-[3px] bg-[#191919]">
            <div
              className="h-full rounded-[3px] transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: capacityColor }}
            />
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {/* Root node — the organization itself */}
        <div className="inline-flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
            <HugeIcon name="chip-stroke-rounded" size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {orgName || t("title")}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground/60">
              {plan}
            </p>
          </div>
        </div>

        {/* Tree spine — solid left border running through every tier. */}
        <div className="relative mt-4 space-y-5 pl-6">
          <div className="pointer-events-none absolute inset-y-0 left-[17px] w-px bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-transparent" />
          {tiers.map((tier, i) => (
            <RoleBranch
              key={tier.key}
              tier={tier}
              isLast={i === tiers.length - 1}
              isAdmin={isAdmin}
              tTeam={tTeam}
              inviteLabel={t("inviteToRole", {
                role: tTeam(`roles.${tier.key}` as Parameters<typeof tTeam>[0]),
              })}
              emptyLabel={t("noOneYet")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleBranch({
  tier,
  isLast,
  isAdmin,
  tTeam,
  inviteLabel,
  emptyLabel,
}: {
  tier: (typeof ROLE_HIERARCHY)[number] & { members: TeamMember[] };
  isLast: boolean;
  isAdmin: boolean;
  tTeam: ReturnType<typeof useTranslations>;
  inviteLabel: string;
  emptyLabel: string;
}) {
  const hex = tier.bg.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? "#6B7280";

  return (
    <div className="relative">
      {/* Branch stub from the spine into the tier badge */}
      <span
        className="pointer-events-none absolute left-[-23px] top-[19px] h-px w-[18px]"
        style={{ backgroundColor: `${hex}55` }}
      />
      {/* Shave the last tier's spine so the line doesn't overshoot */}
      {isLast && (
        <span className="pointer-events-none absolute left-[-23px] top-[20px] bottom-[-28px] w-px bg-card" />
      )}

      {/* Tier badge (icon + role + count) */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg text-white/95 shadow-sm",
            tier.bg,
          )}
        >
          <HugeIcon name={tier.icon} size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: hex }}>
            {tTeam(`roles.${tier.key}` as Parameters<typeof tTeam>[0])}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/50">
            {tier.members.length === 1
              ? tTeam("memberCount", { count: tier.members.length })
              : tTeam("memberCountPlural", { count: tier.members.length })}
          </p>
        </div>
      </div>

      {/* Members, branching off the tier backbone */}
      <div
        className="relative ml-[19px] mt-3 space-y-2 pl-6"
        style={{
          backgroundImage:
            tier.members.length > 0 || isAdmin
              ? `linear-gradient(to bottom, ${hex}40, ${hex}15)`
              : undefined,
          backgroundRepeat: "no-repeat",
          backgroundSize: "1px calc(100% - 24px)",
          backgroundPosition: "0 0",
        }}
      >
        {tier.members.map((member, j) => (
          <Link
            key={member.id}
            href="/app/settings/team"
            className="group relative flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.03]"
          >
            {/* Horizontal connector from the tier spine into each row */}
            <span
              className="pointer-events-none absolute left-[-24px] top-1/2 h-px w-[20px]"
              style={{ backgroundColor: `${hex}50` }}
            />
            {j === tier.members.length - 1 && (
              <span
                className="pointer-events-none absolute left-[-24px] top-[50%] bottom-[-8px] w-px"
                style={{ backgroundColor: "var(--card)" }}
              />
            )}

            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-[12px] font-bold text-muted-foreground">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                (member.full_name ?? member.email).charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {member.full_name ?? member.email}
              </p>
              <p className="truncate text-[11px] text-muted-foreground/50">
                {member.email}
              </p>
            </div>
            <HugeIcon
              name="arrow-right-01-stroke-rounded"
              size={14}
              className="shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground"
            />
          </Link>
        ))}

        {tier.members.length === 0 &&
          (isAdmin ? (
            <Link
              href="/app/settings/team"
              className="relative flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: `${hex}50` }}
            >
              <span
                className="pointer-events-none absolute left-[-24px] top-1/2 h-px w-[20px]"
                style={{ backgroundColor: `${hex}50` }}
              />
              <span
                className="pointer-events-none absolute left-[-24px] top-[50%] bottom-[-8px] w-px"
                style={{ backgroundColor: "var(--card)" }}
              />
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${hex}25`, color: hex }}
              >
                <HugeIcon name="add-01" size={13} />
              </span>
              <span className="text-sm font-medium" style={{ color: hex }}>
                {inviteLabel}
              </span>
            </Link>
          ) : (
            <div className="relative flex items-center gap-3 rounded-lg border border-dashed border-white/[0.06] px-3 py-2.5">
              <span
                className="pointer-events-none absolute left-[-24px] top-1/2 h-px w-[20px]"
                style={{ backgroundColor: `${hex}40` }}
              />
              <span
                className="pointer-events-none absolute left-[-24px] top-[50%] bottom-[-8px] w-px"
                style={{ backgroundColor: "var(--card)" }}
              />
              <span className="text-sm text-muted-foreground/40">
                {emptyLabel}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
