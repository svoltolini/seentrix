"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopilotContext } from "./copilot-context";
import { CopilotSheet } from "./copilot-sheet";

/**
 * Wraps the authenticated app and renders the Copilot sheet once. The
 * sheet itself is absolutely positioned, so the provider has no visible
 * footprint until `open()` is called.
 *
 * Global ⌘K / Ctrl+K shortcut is registered here so it works from any
 * page below.
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const open = useCallback((s?: string) => {
    if (s) setSeed(s);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const clearSeed = useCallback(() => setSeed(null), []);

  // Global ⌘K / Ctrl+K to toggle.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, seed, clearSeed }),
    [isOpen, open, close, toggle, seed, clearSeed],
  );

  return (
    <CopilotContext.Provider value={value}>
      {children}
      <CopilotSheet />
    </CopilotContext.Provider>
  );
}
