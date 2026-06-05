/**
 * Optional AI-generated training video per lesson.
 *
 * Only lessons present in this map render a video player at the top of the
 * lesson reader. Assets live under `/public/academy/`. Today only the
 * flagship "CRA 101" lesson ships a video (a proof-of-concept fully
 * AI-generated explainer); more can be added by dropping an mp4 + poster in
 * `/public/academy/` and adding an entry here.
 */

export interface LessonVideo {
  /** Public path to the mp4. */
  src: string;
  /** Public path to the poster/still frame. */
  poster: string;
  /** Whole-second duration, for the UI label. */
  durationSeconds: number;
}

export const LESSON_VIDEOS: Record<string, LessonVideo> = {
  "cra-101": {
    src: "/academy/cra-101.mp4",
    poster: "/academy/cra-101-poster.png",
    durationSeconds: 8,
  },
};

export function getLessonVideo(lessonId: string): LessonVideo | null {
  return LESSON_VIDEOS[lessonId] ?? null;
}
