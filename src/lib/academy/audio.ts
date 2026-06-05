/**
 * AI-generated audio briefing per lesson.
 *
 * Every Academy lesson ships a ~2-3 minute AI-narrated briefing that
 * summarises the lesson before the learner reads it. Assets live under
 * `/public/academy/<id>-briefing.mp3` and are generated from the lesson's own
 * content (see the scripting pipeline in the repo tooling). The lesson reader
 * renders a player at the top when an entry exists here; the Academy hub shows
 * an "Audio" badge on those lessons.
 */

export interface LessonAudio {
  /** Public path to the mp3. */
  src: string;
  /** Whole-second duration, for the UI label. */
  durationSeconds: number;
}

export const LESSON_AUDIO: Record<string, LessonAudio> = {
  "cra-101": { src: "/academy/cra-101-briefing.mp3", durationSeconds: 294 },
  "annex-i-essential-requirements": {
    src: "/academy/annex-i-essential-requirements-briefing.mp3",
    durationSeconds: 179,
  },
  "economic-operator-roles": {
    src: "/academy/economic-operator-roles-briefing.mp3",
    durationSeconds: 152,
  },
  "conformity-assessment-routes": {
    src: "/academy/conformity-assessment-routes-briefing.mp3",
    durationSeconds: 148,
  },
  "declaration-of-conformity": {
    src: "/academy/declaration-of-conformity-briefing.mp3",
    durationSeconds: 173,
  },
  "support-period-obligations": {
    src: "/academy/support-period-obligations-briefing.mp3",
    durationSeconds: 129,
  },
  "vulnerability-handling-101": {
    src: "/academy/vulnerability-handling-101-briefing.mp3",
    durationSeconds: 128,
  },
  "scoring-vulnerabilities": {
    src: "/academy/scoring-vulnerabilities-briefing.mp3",
    durationSeconds: 131,
  },
  "sbom-fundamentals": {
    src: "/academy/sbom-fundamentals-briefing.mp3",
    durationSeconds: 155,
  },
  "article-14-reporting": {
    src: "/academy/article-14-reporting-briefing.mp3",
    durationSeconds: 149,
  },
  "cvd-and-psirt": {
    src: "/academy/cvd-and-psirt-briefing.mp3",
    durationSeconds: 140,
  },
};

export function getLessonAudio(lessonId: string): LessonAudio | null {
  return LESSON_AUDIO[lessonId] ?? null;
}
