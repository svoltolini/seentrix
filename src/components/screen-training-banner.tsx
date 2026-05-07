import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { SCREEN_LESSONS, type ScreenKey } from "@/lib/academy/screens";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import { Icon } from "@/components/icon";
import { BannerDismiss } from "./screen-training-banner.client";

/**
 * Thin banner at the top of a screen: \u201CNew to this screen? N lessons
 * cover it in M min.\u201D Hides itself when the caller has already passed
 * every lesson the SCREEN_LESSONS map assigns to this screen. Also
 * dismissable per-user per-screen via localStorage (see the client
 * dismiss button).
 *
 * Rendered as a server component so we can filter incomplete lessons
 * server-side without flashing the banner during hydration.
 */
export async function ScreenTrainingBanner({
  screenKey,
}: {
  screenKey: ScreenKey;
}) {
  const screen = SCREEN_LESSONS[screenKey];
  if (!screen) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: completions } = await supabase
    .from("academy_completions")
    .select("lesson_id")
    .eq("user_id", user.id);
  const done = new Set(
    (completions ?? []).map((r) => (r as { lesson_id: string }).lesson_id),
  );

  const pending = screen.lessons.filter((id) => !done.has(id));
  if (pending.length === 0) return null;

  const t = await getTranslations("academy.banner");
  const totalMinutes = pending.reduce((sum, id) => {
    const lesson = ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS];
    const match = lesson?.duration.match(/\d+/);
    return sum + (match ? parseInt(match[0], 10) : 0);
  }, 0);

  // Pick a direct deep-link: if there's exactly one pending, go straight to
  // that lesson. Otherwise point at the Academy "By Screen" tab so the user
  // lands on the list of what's pending for this screen.
  const href =
    pending.length === 1
      ? `/app/academy/${pending[0]}`
      : "/app/academy?tab=by-screen";

  const storageKey = `stb:${user.id}:${screenKey}`;

  return (
    <div
      data-screen-training-banner={screenKey}
      data-storage-key={storageKey}
      className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-warning/25 bg-warning/5 p-4"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Icon name="elearning-exchange-stroke-rounded" size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-l5 text-foreground">{t("title")}</p>
        <p className="mt-0.5 text-p3 text-muted-foreground">
          {t("body", { count: pending.length, minutes: totalMinutes })}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-warning px-3.5 py-2 text-l6 text-white transition-transform hover:-translate-y-0.5"
      >
        {t("cta")}
      </Link>
      <BannerDismiss storageKey={storageKey} screenKey={screenKey}>
        {t("dismiss")}
      </BannerDismiss>
    </div>
  );
}
