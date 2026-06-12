"use client";

import { createContext, useContext } from "react";

// ---------------------------------------------------------------------------
// Global Copilot open/close state. Any component (the topbar button, an
// inline "Ask Copilot about this SBOM" link, a ⌘K keybinding) can call
// useCopilot().open() to reveal the drawer.
// ---------------------------------------------------------------------------

export interface CopilotContextValue {
  isOpen: boolean;
  open: (seed?: string) => void;
  close: () => void;
  toggle: () => void;
  /**
   * If a caller passed a seed via `open("What does Art. 14 say?")`, the
   * drawer reads it once on mount and clears it.
   */
  seed: string | null;
  clearSeed: () => void;
  /**
   * Screen-contextual FAB override: when a screen registers a topic (via
   * <CopilotFabContext/>), the floating button relabels itself (e.g. "Ask
   * Seentrix AI about SBOMs") and opens pre-seeded with that screen's
   * question.
   */
  fab: { label: string; seed?: string } | null;
  setFab: (fab: { label: string; seed?: string } | null) => void;
}

export const CopilotContext = createContext<CopilotContextValue | null>(null);

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error(
      "useCopilot must be used inside <CopilotProvider> — wrap the subtree in src/app/[locale]/app/layout.tsx.",
    );
  }
  return ctx;
}
