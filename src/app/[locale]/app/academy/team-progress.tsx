import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLesson,
  requiredLessonsForRole,
} from "@/lib/academy/lessons";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { Icon } from "@/components/icon";

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

  const { data: members } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .order("created_at", { ascending: true });

  const memberList = (members ?? []) as TeamMember[];

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

  const orgDone = memberList.filter((member) => {
    const required = requiredLessonsForRole(member.role);
    const done = completionMap.get(member.id) ?? new Map();
    return required.length > 0 && required.every((id) => done.has(id));
  }).length;
  const orgPct = Math.round((orgDone / memberList.length) * 100);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-md bg-dark-cta p-6 md:p-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white backdrop-blur-sm">
              <Icon name="task-done-02-stroke-rounded" size={18} />
            </span>
            <h2 className="text-h3 text-white">{t("heading")}</h2>
          </div>
          <p className="mt-2 max-w-xl text-p3 text-white/80">
            {t("description")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative flex size-20 items-center justify-center">
            <svg viewBox="0 0 72 72" className="size-20 -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/15"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(orgPct / 100) * (2 * Math.PI * 30)} ${2 * Math.PI * 30}`}
                className="text-accent"
              />
            </svg>
            <span className="absolute text-l5 tabular-nums text-white">
              {orgPct}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-h5 tabular-nums text-white">
              {orgDone}/{memberList.length}
            </span>
            <span className="text-p4 text-white/70">
              {t("complete").toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-end">
        <a
          href="/api/academy/team-progress"
          download
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-l6-plus text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t("exportCsv")} ↓
        </a>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {memberList.map((member) => {
          const required = requiredLessonsForRole(member.role);
          const memberCompletions = completionMap.get(member.id) ?? new Map();
          const doneCount = required.filter((id) => memberCompletions.has(id))
            .length;
          const pending = required.filter((id) => !memberCompletions.has(id));
          const pct =
            required.length > 0
              ? Math.round((doneCount / required.length) * 100)
              : 100;
          const status: "complete" | "in_progress" | "not_started" =
            pct === 100
              ? "complete"
              : doneCount === 0
                ? "not_started"
                : "in_progress";

          return (
            <MemberCard
              key={member.id}
              member={member}
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
        })}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  requiredCount,
  doneCount,
  pct,
  status,
  pendingLabels,
  extraPending,
}: {
  member: TeamMember;
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
    <div className="rounded-md bg-card shadow-card-sm p-5 transition-colors duration-300 hover:bg-muted/30">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-h5 text-foreground">
              {member.full_name ?? member.email}
            </p>
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
