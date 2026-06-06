/**
 * Shared Academy lesson + quiz types.
 *
 * Each lesson lives in `src/content/academy/<id>.tsx` and default-exports a
 * `Lesson` object. The registry in `@/lib/academy/lessons.ts` imports all of
 * them and exposes a `getLesson(id, locale)` helper.
 */

import type { ReactNode } from "react";

export type RoleId =
  | "admin"
  | "compliance_officer"
  | "cto"
  | "editor"
  | "viewer";

export type LocaleId = "en" | "de" | "fr" | "it";

/** A single lesson section — a heading + prose body. */
export interface LessonSection {
  heading: string;
  body: ReactNode;
}

/** A single multiple-choice quiz question. */
export interface QuizQuestion {
  /** The question prompt. */
  question: string;
  /** Answer options; order matters (correctIndex references this). */
  options: string[];
  /** Zero-based index of the correct answer. */
  correctIndex: number;
  /** One-line explanation shown after the user answers. */
  explanation: string;
}

/** Per-locale lesson content. */
export interface LessonLocale {
  title: string;
  /** Short summary shown on the Academy hub and in the side sheet. */
  summary: string;
  /** Ordered sections that make up the lesson body. */
  sections: LessonSection[];
  /**
   * 5 quiz questions. The Quiz component enforces 4/5 (80%) to pass.
   * Keep each question's explanation tied to the reasoning, not the answer
   * alone, so retries teach the concept.
   */
  quiz: QuizQuestion[];
}

/** Full lesson definition. */
export interface Lesson {
  /** Stable id used in URLs + DB rows. Must match key in `LESSONS`. */
  id: string;
  /** Estimated reading + quiz time, e.g. "5 min". */
  duration: string;
  /** Which roles this lesson is mandatory for. */
  requiredForRoles: RoleId[];
  /** Other lesson ids a learner should complete first (optional). */
  prerequisites?: string[];
  /**
   * Per-locale content. English (`en`) is required and is the fallback for any
   * locale not yet authored (see `getLessonContent`). German/French/Italian are
   * optional so locales can be filled in incrementally without breaking the
   * build.
   */
  i18n: { en: LessonLocale } & Partial<Record<LocaleId, LessonLocale>>;
}

/** Quiz pass threshold — 4 out of 5 answers correct. */
export const QUIZ_PASS_THRESHOLD = 0.8;

/** Cooldown between quiz attempts for the same lesson, in minutes. */
export const QUIZ_COOLDOWN_MINUTES = 30;
