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
import { FieldHelp } from "@/components/field-help";
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

  // Shortcut so each FieldHelp resolves title/body/ref from settings.json
  // under the `tooltips.<key>` namespace without three separate t() calls.
  const tip = (key: string) => ({
    title: t(`tooltips.${key}.title`),
    body: t(`tooltips.${key}.body`),
    reference: t(`tooltips.${key}.ref`),
  });

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
              <Label htmlFor="name">
                {t("nameLabel")}
                <FieldHelp {...tip("name")} />
              </Label>
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
              <Label>
                {t("languageLabel")}
                <FieldHelp {...tip("language")} />
              </Label>
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
              <Label htmlFor="legal_name">
                {t("legalName")}
                <FieldHelp {...tip("legalName")} />
              </Label>
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
                <FieldHelp {...tip("registrationNumber")} />
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
                <Label htmlFor="signatory_name">
                  {t("signatoryName")}
                  <FieldHelp {...tip("signatoryName")} />
                </Label>
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
                  <FieldHelp {...tip("signatoryPosition")} />
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
                <Label htmlFor="contact_email">
                  {t("contactEmail")}
                  <FieldHelp {...tip("contactEmail")} />
                </Label>
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
                <Label htmlFor="website">
                  {t("website")}
                  <FieldHelp {...tip("website")} />
                </Label>
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
              <Label htmlFor="address_line1">
                {t("addressLine1")}
                <FieldHelp {...tip("addressLine1")} />
              </Label>
              <Input
                id="address_line1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder={t("addressLine1Placeholder")}
                disabled={!isAdmin}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line2">
                {t("addressLine2")}
                <FieldHelp {...tip("addressLine2")} />
              </Label>
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
                <Label htmlFor="postal_code">
                  {t("postalCode")}
                  <FieldHelp {...tip("postalCode")} />
                </Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t("postalCodePlaceholder")}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">
                  {t("city")}
                  <FieldHelp {...tip("city")} />
                </Label>
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
              <Label htmlFor="country">
                {t("country")}
                <FieldHelp {...tip("country")} />
              </Label>
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
// A single vertical trunk runs the height of the tree, branching right into
// a box per CRA role. The trunk caps with a rounded corner at the first and
// last tier so the endpoints don't hang. Empty roles show a dashed "Invite a
// <role>" branch for admins, or a muted "No one yet" for everyone else.
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
        {/* Tree: each tier draws its own connector SVG so the trunk + L-bend
            are precise at any row height; no overlap tricks. Top and bottom
            tiers cap the trunk with a rounded corner. */}
        <ol>
          {tiers.map((tier, i) => (
            <RoleBranch
              key={tier.key}
              tier={tier}
              isFirst={i === 0}
              isLast={i === tiers.length - 1}
              isAdmin={isAdmin}
              tTeam={tTeam}
              inviteLabel={t("inviteToRole", {
                role: tTeam(`roles.${tier.key}` as Parameters<typeof tTeam>[0]),
              })}
              emptyLabel={t("noOneYet")}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function RoleBranch({
  tier,
  isFirst,
  isLast,
  isAdmin,
  tTeam,
  inviteLabel,
  emptyLabel,
}: {
  tier: (typeof ROLE_HIERARCHY)[number] & { members: TeamMember[] };
  isFirst: boolean;
  isLast: boolean;
  isAdmin: boolean;
  tTeam: ReturnType<typeof useTranslations>;
  inviteLabel: string;
  emptyLabel: string;
}) {
  const hex = tier.bg.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? "#6B7280";
  // Trunk geometry — kept constant across tiers so the SVG paths line up.
  // STUB_Y matches the vertical center of the size-11 (44px) badge so the
  // horizontal stub points straight at the role icon.
  const STUB_Y = 22;
  const RADIUS = 8;
  const STROKE = {
    stroke: "white",
    strokeOpacity: "0.1",
    strokeWidth: "1",
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <li
      className={cn(
        "relative list-none",
        !isLast && "pb-5", // gap before next tier; trunk runs through it
      )}
      style={{ paddingLeft: 40 }}
    >
      {/* Connector: vertical trunk + horizontal stub to the badge. Top and
          bottom tiers get a rounded L-corner so the trunk caps cleanly; the
          middle tiers use a plain T-junction. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full"
        width="40"
        height="100%"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {/* Vertical trunk. Clipped by STUB_Y ± RADIUS on the end tiers so
            the straight segment meets the arc without overlap. */}
        <line
          x1="17"
          y1={isFirst ? STUB_Y + RADIUS : 0}
          x2="17"
          y2={isLast ? STUB_Y - RADIUS : "100%"}
          {...STROKE}
        />
        {/* Top-left L-arc — caps the top of the trunk on the first tier. */}
        {isFirst && (
          <path
            d={`M ${17 + RADIUS} ${STUB_Y} A ${RADIUS} ${RADIUS} 0 0 1 17 ${STUB_Y + RADIUS}`}
            fill="none"
            {...STROKE}
          />
        )}
        {/* Bottom-left L-arc — caps the bottom of the trunk on the last tier. */}
        {isLast && (
          <path
            d={`M 17 ${STUB_Y - RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${17 + RADIUS} ${STUB_Y}`}
            fill="none"
            {...STROKE}
          />
        )}
        {/* Horizontal stub. Starts past the corner on end tiers so the arc
            joins it without a kink. */}
        <line
          x1={isFirst || isLast ? 17 + RADIUS : 17}
          y1={STUB_Y}
          x2="40"
          y2={STUB_Y}
          {...STROKE}
        />
      </svg>

      {/* Tier badge */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg text-white/95 shadow-sm",
            tier.bg,
          )}
        >
          <HugeIcon name={tier.icon} size={18} />
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

      {/* Members — plain indented list; the trunk above already carries the
          hierarchy signal, sub-connectors would just add clutter. */}
      <div className="mt-2.5 ml-[22px] space-y-1.5">
        {tier.members.map((member) => (
          <Link
            key={member.id}
            href="/app/settings/team"
            className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.03]"
          >
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
              className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: `${hex}50` }}
            >
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
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/[0.06] px-3 py-2.5">
              <span className="text-sm text-muted-foreground/40">
                {emptyLabel}
              </span>
            </div>
          ))}
      </div>
    </li>
  );
}
