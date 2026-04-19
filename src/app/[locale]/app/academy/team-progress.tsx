import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  allLessonIds,
  getLesson,
  requiredLessonsForRole,
} from "@/lib/academy/lessons";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

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
 * Team Progress — admin/compliance-officer-only view of training status
 * across the whole org. Renders a per-member × per-lesson grid with
 * completion ticks; includes a simple CSV download link so regulators
 * can be handed an auditable export.
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

  const lessonIds = allLessonIds();

  if (memberList.length === 0) {
    return (
      <p className="rounded-xl border border-white/[0.06] bg-card p-6 text-sm text-muted-foreground">
        {t("noTeam")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-xl border border-white/[0.06] bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3">{t("member")}</th>
              <th className="px-5 py-3">{t("role")}</th>
              <th className="px-5 py-3">{t("overall")}</th>
              {lessonIds.map((id) => {
                const lesson = getLesson(id);
                const title = lesson?.i18n[locale]?.title ?? id;
                return (
                  <th
                    key={id}
                    className="px-3 py-3 text-center text-[10px]"
                    title={title}
                  >
                    <span className="inline-block max-w-[90px] truncate align-middle">
                      {title}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {memberList.map((member) => {
              const required = requiredLessonsForRole(member.role);
              const memberCompletions =
                completionMap.get(member.id) ?? new Map();
              const doneCount = required.filter((id) =>
                memberCompletions.has(id),
              ).length;
              const totalRequired = required.length || 1;
              const pct = Math.round((doneCount / totalRequired) * 100);
              return (
                <tr
                  key={member.id}
                  className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.015]"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">
                      {member.full_name ?? member.email}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {member.email}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {member.role}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct === 100
                              ? "bg-[#16A34A]"
                              : pct >= 50
                                ? "bg-[#D97706]"
                                : "bg-[#DC2626]",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  </td>
                  {lessonIds.map((id) => {
                    const row = memberCompletions.get(id);
                    const isRequired = required.includes(id);
                    return (
                      <td key={id} className="px-3 py-3 text-center">
                        {row ? (
                          <span
                            className="inline-flex size-5 items-center justify-center rounded-full bg-[#16A34A]/15 text-[#16A34A]"
                            title={`${Math.round(row.score * 100)}% · ${new Date(row.completed_at).toLocaleDateString()}`}
                          >
                            ✓
                          </span>
                        ) : isRequired ? (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground/60">
                            —
                          </span>
                        ) : (
                          <span className="text-muted-foreground/20">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
