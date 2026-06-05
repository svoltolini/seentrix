/**
 * Optional AI-generated audio briefing per lesson.
 *
 * Only lessons present in this map render an audio player at the top of the
 * lesson reader. Assets live under `/public/academy/`. Today only the flagship
 * "CRA 101" lesson ships a briefing (a ~5-minute AI-narrated overview of the
 * Cyber Resilience Act); more can be added by dropping an mp3 in
 * `/public/academy/` and adding an entry here.
 */

export interface LessonAudio {
  /** Public path to the mp3. */
  src: string;
  /** Whole-second duration, for the UI label. */
  durationSeconds: number;
}

export const LESSON_AUDIO: Record<string, LessonAudio> = {
  "cra-101": {
    src: "/academy/cra-101-briefing.mp3",
    durationSeconds: 294,
  },
};

export function getLessonAudio(lessonId: string): LessonAudio | null {
  return LESSON_AUDIO[lessonId] ?? null;
}
