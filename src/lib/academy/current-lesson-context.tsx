"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Broadcasts the id of the lesson the user is currently reading. Consumed
 * by <HelpSheet> so glossary side-sheets can filter out the "Open lesson"
 * CTA when it would point back to the lesson already on screen (otherwise
 * users get a self-referencing "Open this same page" affordance that
 * reads as broken).
 *
 * `null` when we're not on a lesson page — in that case every lesson CTA
 * is valid and the sheet renders them unfiltered.
 */
const CurrentLessonContext = createContext<string | null>(null);

export function CurrentLessonProvider({
  lessonId,
  children,
}: {
  lessonId: string;
  children: ReactNode;
}) {
  return (
    <CurrentLessonContext.Provider value={lessonId}>
      {children}
    </CurrentLessonContext.Provider>
  );
}

export function useCurrentLessonId(): string | null {
  return useContext(CurrentLessonContext);
}
