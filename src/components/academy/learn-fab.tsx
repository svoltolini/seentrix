"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { useCopilot } from "@/components/copilot/copilot-context";
import { SCREEN_LESSONS, type ScreenKey } from "@/lib/academy/screens";

/**
 * Floating "Learn this screen" pill — the compact successor to the old
 * full-width "New to this screen?" banner. It stacks just above the dark
 * Copilot FAB and always deep-links to the Academy "By Screen" tab,
 * scrolled to this screen's card (one predictable destination — an
 * earlier one-lesson-left shortcut straight into the lesson read as
 * random to users).
 * Screens opt in by rendering <LearnScreenContext screenKey="sbom" /> —
 * a renderless registrar, mirroring <CopilotFabContext/>. Completions are
 * fetched once in the app layout and passed to the provider, so showing
 * or hiding the pill costs no per-navigation queries; once every mapped
 * lesson is completed the pill disappears.
 */

interface LearnFabContextValue {
  completed: Set<string>;
  screenKey: ScreenKey | null;
  setScreenKey: (key: ScreenKey | null) => void;
}

const LearnFabContext = createContext<LearnFabContextValue | null>(null);

function useLearnFab(): LearnFabContextValue {
  const ctx = useContext(LearnFabContext);
  if (!ctx) {
    throw new Error(
      "useLearnFab must be used inside <LearnFabProvider> — wrap the subtree in src/app/[locale]/app/layout.tsx.",
    );
  }
  return ctx;
}

export function LearnFabProvider({
  completedLessonIds,
  children,
}: {
  completedLessonIds: string[];
  children: React.ReactNode;
}) {
  const [screenKey, setScreenKey] = useState<ScreenKey | null>(null);
  const completed = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds],
  );
  const value = useMemo(
    () => ({ completed, screenKey, setScreenKey }),
    [completed, screenKey],
  );

  return (
    <LearnFabContext.Provider value={value}>
      {children}
      <LearnFabButton />
    </LearnFabContext.Provider>
  );
}

/** Renderless registrar — mounts a screen's topic, clears it on unmount. */
export function LearnScreenContext({ screenKey }: { screenKey: ScreenKey }) {
  const { setScreenKey } = useLearnFab();

  useEffect(() => {
    setScreenKey(screenKey);
    return () => setScreenKey(null);
  }, [screenKey, setScreenKey]);

  return null;
}

function LearnFabButton() {
  const t = useTranslations("academy");
  const { isOpen } = useCopilot();
  const { completed, screenKey } = useLearnFab();

  // Hidden while the Copilot drawer is open (same rule as the Copilot FAB).
  if (!screenKey || isOpen) return null;

  const pending = (SCREEN_LESSONS[screenKey]?.lessons ?? []).filter(
    (id) => !completed.has(id),
  );
  if (pending.length === 0) return null;

  return (
    <Link
      href={`/app/academy?tab=by-screen&screen=${screenKey}`}
      className="group/learn fixed bottom-[84px] right-6 z-40 flex items-center gap-2.5 rounded-full border border-border-strong bg-card py-1.5 pl-1.5 pr-[18px] text-[12.5px] font-semibold text-foreground shadow-[0_8px_28px_rgba(40,30,20,0.16)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-muted"
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-[color:var(--primary-3)] text-primary">
        <Icon
          name="elearning-exchange-stroke-rounded"
          size={14}
          className="transition-transform duration-300 ease-out group-hover/learn:scale-110"
        />
      </span>
      {t("fab.label")}
    </Link>
  );
}
