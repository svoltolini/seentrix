"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { FieldHelp } from "@/components/field-help";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  removeTeamMember,
  createMember,
  updateMemberRole,
  type TeamMember,
} from "../actions";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_USER_LIMITS } from "@/lib/constants/plans";
import { useToast } from "@/components/ui/toast";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  compliance_officer: "bg-accent/15 text-accent",
  cto: "bg-accent/15 text-accent",
  editor: "bg-[#FF9E55]/15 text-[#FF9E55]",
  viewer: "bg-muted text-muted-foreground",
};

const ASSIGNABLE_ROLES = [
  "viewer",
  "editor",
  "compliance_officer",
  "cto",
  "admin",
] as const;

export function TeamContent({
  plan,
  members: initialMembers,
  currentUserId,
  currentUserRole,
}: {
  plan: OrgPlan;
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const t = useTranslations("settings.team");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    member: TeamMember;
    newRole: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = currentUserRole === "admin";

  // Only Business/Enterprise can manage teams
  if (plan === "free" || plan === "professional") {
    return <TeamUpgradePrompt />;
  }

  const count = members.length;
  const limit = PLAN_USER_LIMITS[plan];
  const canAdd = count < limit;

  function handleRemove() {
    if (!removeTarget) return;
    const targetId = removeTarget.id;

    startTransition(async () => {
      const result = await removeTeamMember(targetId);
      if (result?.error) {
        toast({ type: "error", message: t("removeError") });
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== targetId));
        toast({ type: "success", message: t("removed") });
        router.refresh();
      }
      setRemoveTarget(null);
    });
  }

  function handleRoleChange() {
    if (!roleChangeTarget) return;
    const { member, newRole } = roleChangeTarget;

    startTransition(async () => {
      const result = await updateMemberRole(member.id, newRole);
      if (result?.error) {
        if (result.error === "lastAdmin") {
          toast({ type: "error", message: t("lastAdminError") });
        } else {
          toast({ type: "error", message: t("roleChangeError") });
        }
      } else {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
        );
        toast({ type: "success", message: t("roleChanged") });
        router.refresh();
      }
      setRoleChangeTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Plan limit banner */}
      {!canAdd && (
        <div className="flex items-center gap-4 overflow-hidden rounded-md bg-card p-[18px] shadow-card-lg">
          <div className="relative flex size-10 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-border"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${(count / limit) * 94.2} 94.2`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <span className="absolute text-l6-plus tabular-nums text-foreground">
              {count}/{limit}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-l6 text-foreground">{t("limits.reached")}</p>
            <p className="mt-0.5 text-p4 text-muted-foreground">
              {limit === 1
                ? t("limits.reachedDescription", {
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    limit,
                  })
                : t("limits.reachedDescriptionPlural", {
                    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                    limit,
                  })}
            </p>
          </div>
          <Link href="/app/settings/billing" className="shrink-0">
            <Button size="sm">{t("limits.upgrade")}</Button>
          </Link>
        </div>
      )}

      {/* Create member section (admin only) */}
      {isAdmin && (
        <CreateMemberSection
          canAdd={canAdd}
          onMemberCreated={(member) => {
            setMembers((prev) => [...prev, member]);
            router.refresh();
          }}
        />
      )}

      {/* Members list */}
      <div className="rounded-md bg-card shadow-card-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-h4 text-foreground">{t("members")}</h2>
          <span className="text-p4 text-muted-foreground">
            {count === 1
              ? t("memberCount", { count })
              : t("memberCountPlural", { count })}
          </span>
        </div>
        <div className="divide-y divide-border">
          {members.map((member) => {
            const isCurrentUser = member.id === currentUserId;
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 px-6 py-3.5"
              >
                {/* Avatar */}
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-l6-plus text-primary">
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

                {/* Name / email */}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-l6 text-foreground">
                    {member.full_name ?? member.email}
                    {isCurrentUser && (
                      <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-0.5 text-l6-plus text-primary">
                        {t("you")}
                      </span>
                    )}
                    {member.must_change_password && (
                      <span className="shrink-0 rounded-sm bg-warning/10 px-1.5 py-0.5 text-l6-plus text-warning">
                        {t("pendingPassword")}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-p4 text-muted-foreground">
                    {member.email}
                  </p>
                </div>

                {/* Role */}
                {isAdmin && !isCurrentUser ? (
                  <div className="flex shrink-0 gap-1">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          if (role !== member.role) {
                            setRoleChangeTarget({ member, newRole: role });
                          }
                        }}
                        className={cn(
                          "rounded-sm px-2 py-0.5 text-l6-plus transition-all",
                          role === member.role
                            ? ROLE_STYLE[role]
                            : "text-muted-foreground hover:text-muted-foreground"
                        )}
                      >
                        {t(`roles.${role}` as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span
                    className={cn(
                      "shrink-0 rounded-sm px-2.5 py-0.5 text-l6-plus",
                      ROLE_STYLE[member.role] ?? ROLE_STYLE.viewer
                    )}
                  >
                    {t(`roles.${member.role}` as Parameters<typeof t>[0])}
                  </span>
                )}

                {/* Remove button */}
                {isAdmin && !isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setRemoveTarget(member)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    {t("removeMember")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remove member dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={t("removeMemberConfirm")}
        description={t("removeMemberDescription", {
          name: removeTarget?.full_name ?? removeTarget?.email ?? "",
        })}
        confirmLabel={t("removeMemberSubmit")}
        cancelLabel={t("removeMemberCancel")}
        onConfirm={handleRemove}
        disabled={isPending}
        variant="destructive"
      />

      {/* Role change dialog */}
      <ConfirmDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
        title={t("changeRoleConfirm")}
        description={t("changeRoleDescription", {
          name:
            roleChangeTarget?.member.full_name ??
            roleChangeTarget?.member.email ??
            "",
          oldRole: t(
            `roles.${roleChangeTarget?.member.role ?? "viewer"}` as Parameters<
              typeof t
            >[0]
          ),
          newRole: t(
            `roles.${roleChangeTarget?.newRole ?? "viewer"}` as Parameters<
              typeof t
            >[0]
          ),
        })}
        confirmLabel={t("changeRoleSubmit")}
        cancelLabel={t("changeRoleCancel")}
        onConfirm={handleRoleChange}
        disabled={isPending}
        variant="default"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Member Section
// ---------------------------------------------------------------------------

function CreateMemberSection({
  canAdd,
  onMemberCreated,
}: {
  canAdd: boolean;
  onMemberCreated: (member: TeamMember) => void;
}) {
  const t = useTranslations("settings.team");
  const tip = (key: string) => ({
    title: t(`tooltips.${key}.title`),
    body: t(`tooltips.${key}.body`),
    reference: t(`tooltips.${key}.ref`),
  });
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  // After successful creation, show credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await createMember(email, fullName, role, tempPassword);
      if (result.error) {
        const key = `createErrors.${result.error}`;
        const message = t.has(key as Parameters<typeof t>[0])
          ? t(key as Parameters<typeof t>[0])
          : t("createError");
        toast({ type: "error", message });
      } else {
        setCreatedCredentials({ email, password: tempPassword });
        toast({ type: "success", message: t("memberCreated") });
        // Add to local list
        onMemberCreated({
          id: crypto.randomUUID(),
          email,
          full_name: fullName,
          avatar_url: null,
          role,
          is_active: true,
          must_change_password: true,
          created_at: new Date().toISOString(),
        });
        // Reset form
        setEmail("");
        setFullName("");
        setRole("viewer");
        setTempPassword("");
      }
    });
  }

  function handleCopy() {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nTemporary password: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ type: "success", message: t("credentialsCopied") });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-md bg-card shadow-card-lg">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-h4 text-foreground">{t("createTitle")}</h2>
        <p className="mt-1 text-p3 text-muted-foreground">
          {t("createDescription")}
        </p>
      </div>
      <div className="px-6 py-5">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="memberEmail">
                {t("createEmail")}
                <FieldHelp {...tip("email")} />
              </Label>
              <Input
                id="memberEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("createEmailPlaceholder")}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="memberName">
                {t("createName")}
                <FieldHelp {...tip("fullName")} />
              </Label>
              <Input
                id="memberName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("createNamePlaceholder")}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="memberRole">
                {t("createRoleLabel")}
                <FieldHelp {...tip("role")} />
              </Label>
              <select
                id="memberRole"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 rounded-md bg-input px-3 text-p2 text-foreground outline-none border-[1.5px] border-transparent focus:bg-card focus:border-primary/30"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label size="lg" htmlFor="memberPassword">
                {t("createPassword")}
                <FieldHelp {...tip("password")} />
              </Label>
              <div className="relative">
                <Input
                  id="memberPassword"
                  type={showPassword ? "text" : "password"}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder={t("createPasswordPlaceholder")}
                  minLength={8}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Icon name="EyeOff" className="size-4" />
                  ) : (
                    <Icon name="Eye" className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending || !canAdd}>
              {isPending ? t("creatingMember") : t("createMember")}
            </Button>
          </div>
        </form>

        {/* Show credentials after creation */}
        {createdCredentials && (
          <div className="mt-4 rounded-md border border-success/20 bg-success/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-l6 text-success">
                  {t("credentialsTitle")}
                </p>
                <p className="mt-1 text-p4 text-muted-foreground">
                  {t("credentialsHint")}
                </p>
                <div className="mt-3 space-y-1 font-mono text-p3 text-foreground">
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {createdCredentials.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Password:</span>{" "}
                    {createdCredentials.password}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Icon name="CheckIcon" className="size-3.5 text-success" />
                ) : (
                  <Icon name="CopyIcon" className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upgrade prompt
// ---------------------------------------------------------------------------

function TeamUpgradePrompt() {
  const t = useTranslations("settings.team");

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border-outline bg-card py-20 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon
          name="lock-password-stroke-rounded"
          size={28}
          className="text-primary"
        />
      </div>
      <h3 className="text-h4 text-foreground">
        {t("title")}
      </h3>
      <p className="mt-2 max-w-sm text-p3 text-muted-foreground">
        {t("subtitle")}
      </p>
      <Link href="/pricing">
        <Button size="sm" className="mt-8 gap-1.5">
          <Icon name="sparkles-stroke-rounded" size={14} />
          Upgrade Plan
        </Button>
      </Link>
    </div>
  );
}
