import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLesson,
  requiredLessonsForRole,
} from "@/lib/academy/lessons";
import type { LocaleId, RoleId } from "@/lib/academy/types";

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
      <p className="rounded-2xl bg-white/[0.03] p-6 text-sm text-muted-foreground">
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
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white/[0.03] p-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold">{t("heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {orgPct}%
            </div>
            <div className="text-[11px] text-muted-foreground">
              {orgDone}/{memberList.length} {t("complete").toLowerCase()}
            </div>
          </div>
          <a
            href="/api/academy/team-progress"
            download
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.1]"
          >
            {t("exportCsv")} ↓
          </a>
        </div>
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
      ? "#16A34A"
      : status === "not_started"
        ? "#6B7280"
        : "#D97706";

  return (
    <div className="rounded-2xl bg-white/[0.03] p-5 transition-colors duration-300 hover:bg-white/[0.05]">
      <div className="flex items-start gap-4">
        <ProgressRing value={pct} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-heading text-[15px] font-semibold text-foreground">
              {member.full_name ?? member.email}
            </p>
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {member.role}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {member.email}
          </p>
          <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
            {doneCount} / {requiredCount} required lessons passed
          </p>
          {pendingLabels.length > 0 && (
            <p className="mt-2 line-clamp-2 text-[12px] text-muted-foreground/80">
              <span className="font-medium text-foreground/70">Pending:</span>{" "}
              {pendingLabels.join(" · ")}
              {extraPending > 0 && ` · +${extraPending} more`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx="22"
        cy="22"
        r={r}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        className="text-[10px] font-semibold tabular-nums"
      >
        {value}%
      </text>
    </svg>
  );
}
