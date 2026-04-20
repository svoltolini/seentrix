import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AcademyTabs, type TabKey } from "./academy-tabs";
import { TeamProgress } from "./team-progress";
import type { LocaleId, RoleId } from "@/lib/academy/types";
import { requiredLessonsForRole } from "@/lib/academy/lessons";
import { HugeIcon } from "@/components/huge-icon";

/**
 * Academy hub — Layer 2 landing.
 *
 * Tabs: Lessons / By Screen / Glossary / Team Progress (admin + CO only).
 * Tabs deep-link via /app/academy?tab=glossary so /app/help/glossary still
 * works. `completedLessonIds` powers the ✓ ticks on the Lessons + By
 * Screen cards without a client fetch.
 */
export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const locale = (await getLocale()) as LocaleId;
  const t = await getTranslations("academy");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedLessonIds: string[] = [];
  let role: string | null = null;
  if (user) {
    const [completionsRes, userRow] = await Promise.all([
      supabase
        .from("academy_completions")
        .select("lesson_id")
        .eq("user_id", user.id),
      supabase.from("users").select("role").eq("id", user.id).single(),
    ]);
    completedLessonIds = (completionsRes.data ?? []).map(
      (r) => (r as { lesson_id: string }).lesson_id,
    );
    role = (userRow.data as { role: string } | null)?.role ?? null;
  }

  const isAdminOrCO = role === "admin" || role === "compliance_officer";

  // When the training gate is active, render the blocking banner at the top
  // of the Academy so users understand why the rest of the app isn't
  // reachable — without that explanation the redirect feels like a bug.
  const mustCompleteTraining =
    user?.app_metadata?.must_complete_training === true;
  const requiredIds = role
    ? requiredLessonsForRole(role as RoleId)
    : [];
  const requiredDone = requiredIds.filter((id) =>
    completedLessonIds.includes(id),
  ).length;
  const tGate = await getTranslations("academy.gate");

  const initialTab: TabKey =
    tab === "glossary"
      ? "glossary"
      : tab === "by-screen"
        ? "by-screen"
        : tab === "team-progress" && isAdminOrCO
          ? "team-progress"
          : "lessons";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      {mustCompleteTraining ? (
        <div
          className="mb-8 overflow-hidden rounded-2xl bg-cover bg-center p-6 md:mb-10 md:p-10"
          style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-[#F59E0B]" />
                {t("hero.title")}
              </div>
              <h1 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
                {tGate("title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
                {tGate("subtitle")}
              </p>
              <p className="mt-3 text-[13px] text-white/75">
                {tGate("progress", {
                  done: requiredDone,
                  total: requiredIds.length,
                })}
              </p>
            </div>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <HugeIcon
                name="lock-password-stroke-rounded"
                size={24}
                className="text-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="mb-8 overflow-hidden rounded-2xl bg-cover bg-center p-6 md:mb-10 md:p-10"
          style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
        >
          {/* Static eyebrow — no amber pulse here. The pulsing dot is
              reserved for the gate hero (above) where it signals an
              action the user must take. On the happy path it reads as a
              false alarm. */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {t("hero.eyebrow")}
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight text-white md:text-3xl">
            {t("hero.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
            {t("hero.description")}
          </p>
        </div>
      )}

      <AcademyTabs
        initialTab={initialTab}
        completedLessonIds={completedLessonIds}
        isAdminOrCO={isAdminOrCO}
        teamProgress={isAdminOrCO ? <TeamProgress locale={locale} /> : null}
      />
    </div>
  );
}

export const metadata = { title: "Academy" };
