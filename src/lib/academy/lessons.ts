import craOneOOne from "@/content/academy/cra-101";
import type { Lesson, LocaleId, RoleId } from "@/lib/academy/types";

/**
 * Central registry of every Academy lesson. When a new lesson is authored,
 * add its import and entry here — that's the single source of truth the
 * [lessonId] page, the Academy hub, and the Training Compliance dashboard
 * all read from.
 *
 * Lesson ids must match the ACADEMY_LESSONS ids in @/lib/glossary so
 * glossary side-sheets link to real lessons.
 */
export const LESSONS: Record<string, Lesson> = {
  [craOneOOne.id]: craOneOOne,
  // Layer 2, Phase 6: the remaining 10 lessons will be imported here.
};

export function getLesson(id: string): Lesson | null {
  return LESSONS[id] ?? null;
}

/**
 * Resolve the locale-specific content for a lesson. If the requested locale
 * isn't authored yet, fall back to English so the lesson still renders.
 */
export function getLessonContent(lesson: Lesson, locale: LocaleId) {
  return lesson.i18n[locale] ?? lesson.i18n.en;
}

/**
 * Every lesson id that is required for the given role. Order matches the
 * registry iteration order (lessons are authored in the order we want
 * learners to take them in).
 */
export function requiredLessonsForRole(role: RoleId): string[] {
  return Object.values(LESSONS)
    .filter((lesson) => lesson.requiredForRoles.includes(role))
    .map((lesson) => lesson.id);
}

export function allLessonIds(): string[] {
  return Object.keys(LESSONS);
}
