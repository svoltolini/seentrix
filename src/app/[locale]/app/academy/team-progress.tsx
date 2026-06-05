import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLesson,
  requiredLessonsForRole,
} from "@/lib/academy/lessons";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { ReferenceCard } from "@/components/reference-card";

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: RoleId;
};

type CompletionRow = {
  user_id: string;
  lesson_id: string;
  score: number;
  completed_at: string;
};

/**
 * Team Progress — admin/compliance-officer view of training status.
 *
 * One card per team member, no horizontal-scroll matrix. The card carries
 * name, role, overall progress ring, and a condensed list of pending
 * required lessons (if any). Lets the eye scan at-a-glance without
 * giving up per-member detail — auditors can still hit the CSV export
 * for the full grid.
 */
export async function TeamProgress({ locale }: { locale: LocaleId }) {
  const t = await getTranslations("academy.teamProgress");
  const supabase = await createClient();

  const [{ data: members }, { data: auth }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, role")
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const memberList = (members ?? []) as TeamMember[];
  const currentUserId = auth.user?.id ?? null;

  // Split the viewer's own row out from the rest of the team so the two
  // are never confused — "Your progress" sits above "Your team".
  const me = memberList.find((m) => m.id === currentUserId) ?? null;
  const teammates = memberList.filter((m) => m.id !== currentUserId);

  const { data: completions } = await supabase
    .from("academy_completions")
    .select("user_id, lesson_id, score, completed_at");

  const completionMap = new Map<string, Map<string, CompletionRow>>();
  for (const row of (completions ?? []) as CompletionRow[]) {
    if (!completionMap.has(row.user_id)) {
      completionMap.set(row.user_id, new Map());
    }
    completionMap.get(row.user_id)!.set(row.lesson_id, row);
  }

  if (memberList.length === 0) {
    return (
      <p className="rounded-md bg-muted p-6 text-p3 text-muted-foreground">
        {t("noTeam")}
      </p>
    );
  }

  // Count of members who have finished EVERY required lesson for their role.
  const orgDone = memberList.filter((member) => {
    const required = requiredLessonsForRole(member.role);
    const done = completionMap.get(member.id) ?? new Map();
    return required.length > 0 && required.every((id) => done.has(id));
  }).length;

  // Headline progress is the *overall* share of required lessons passed across
  // the whole team (required lessons completed ÷ total required lessons), not
  // the all-or-nothing "fully-complete members" count. This moves with every
  // single completion, so the card visibly updates as people make progress
  // instead of sitting at 0% until someone finishes their entire track.
  let requiredTotal = 0;
  let requiredDone = 0;
  for (const member of memberList) {
    const required = requiredLessonsForRole(member.role);
    const done = completionMap.get(member.id) ?? new Map();
    requiredTotal += required.length;
    requiredDone += required.filter((id) => done.has(id)).length;
  }
  const orgPct =
    requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 0;

  // Compute a member's stats and render their card. Defined inline so it can
  // close over completionMap + locale without prop-drilling.
  function renderMemberCard(member: TeamMember, isYou: boolean) {
    const required = requiredLessonsForRole(member.role);
    const memberCompletions = completionMap.get(member.id) ?? new Map();
    const doneCount = required.filter((id) => memberCompletions.has(id)).length;
    const pending = required.filter((id) => !memberCompletions.has(id));
    const pct =
      required.length > 0 ? Math.round((doneCount / required.length) * 100) : 100;
    const status: "complete" | "in_progress" | "not_started" =
      pct === 100 ? "complete" : doneCount === 0 ? "not_started" : "in_progress";
    return (
      <MemberCard
        key={member.id}
        member={member}
        isYou={isYou}
        requiredCount={required.length}
        doneCount={doneCount}
        pct={pct}
        status={status}
        pendingLabels={pending
          .slice(0, 3)
          .map((id) => getLesson(id)?.i18n[locale]?.title ?? id)}
        extraPending={Math.max(0, pending.length - 3)}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <a
          href="/api/academy/team-progress"
          download
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-l6-plus text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("exportCsv")} ↓
        </a>
      </div>

      {/* "Your progress" — the viewer's own row, called out separately so a
          manager never confuses their own status with the team's. */}
      {me && (
        <section className="mb-6">
          <h3 className="mb-3 text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("yourProgress")}
          </h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {renderMemberCard(me, true)}
          </div>
        </section>
      )}

      {/* "Your team" — everyone else. */}
      {teammates.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-l6-plus uppercase tracking-wider text-muted-foreground">
            {t("yourTeam", { count: teammates.length })}
          </h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {teammates.map((member) => renderMemberCard(member, false))}
          </div>
        </section>
      )}

      {/* Team training-status summary — a closing roll-up below the member
          cards. Uses the same compact horizontal progress bar as the Academy
          hero (slim accent track + small caption) instead of a large ring. */}
      <ReferenceCard className="p-6 md:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-sm">
            <Icon name="task-done-02-stroke-rounded" size={18} />
          </span>
          <h2 className="text-h3 text-white">{t("heading")}</h2>
        </div>
        <p className="mt-2 text-p3 text-white/80">
          {t("description")}
        </p>
        <div className="mt-5 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-dark-cta transition-all"
              style={{ width: `${orgPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-p4 text-white/70">
              {orgDone}/{memberList.length} {t("complete").toLowerCase()}
            </span>
            <span className="text-p4 tabular-nums text-white/70">{orgPct}%</span>
          </div>
        </div>
      </ReferenceCard>
    </div>
  );
}

function MemberCard({
  member,
  isYou,
  requiredCount,
  doneCount,
  pct,
  status,
  pendingLabels,
  extraPending,
}: {
  member: TeamMember;
  isYou: boolean;
  requiredCount: number;
  doneCount: number;
  pct: number;
  status: "complete" | "in_progress" | "not_started";
  pendingLabels: string[];
  extraPending: number;
}) {
  const color =
    status === "complete"
      ? "var(--success)"
      : status === "not_started"
        ? "var(--muted-foreground)"
        : "var(--warning)";

  return (
    <div
      className={cn(
        "rounded-md bg-card p-5 shadow-card-sm transition-colors duration-300 hover:bg-muted/30",
        isYou && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-h5 text-foreground">
              {member.full_name ?? member.email}
            </p>
            {isYou && (
              <span className="shrink-0 rounded-sm bg-primary/10 px-2 py-0.5 text-l6-plus uppercase tracking-wide text-primary">
                You
              </span>
            )}
            <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground">
              {member.role}
            </span>
          </div>
          <p className="mt-0.5 truncate text-p4 text-muted-foreground">
            {member.email}
          </p>
          <p className="mt-2 text-l6-plus tabular-nums text-muted-foreground">
            {doneCount} / {requiredCount} required lessons passed
          </p>
          {pendingLabels.length > 0 && (
            <p className="mt-2 line-clamp-2 text-p4 text-muted-foreground">
              <span className="text-l6 text-foreground">Pending:</span>{" "}
              {pendingLabels.join(" · ")}
              {extraPending > 0 && ` · +${extraPending} more`}
            </p>
          )}
        </div>
        <ProgressRing value={pct} color={color} />
      </div>
    </div>
  );
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx="36"
        cy="36"
        r={r}
        stroke="var(--border)"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        className="text-l6 tabular-nums"
      >
        {value}%
      </text>
    </svg>
  );
}
