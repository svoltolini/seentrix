"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCopilot } from "./copilot-context";

/**
 * CopilotFabContext — registers a screen topic with the floating Copilot
 * button. While the host screen is mounted, the FAB relabels itself (e.g.
 * "Ask Seentrix AI about SBOMs") and opens pre-seeded with the screen's
 * question; on unmount the FAB reverts to its generic label.
 *
 * Renders nothing — drop it anywhere in a screen:
 *
 *   <CopilotFabContext topicKey="sbom" seed="How do I generate an SBOM…" />
 *
 * Topic labels live under `copilot.fab.<topicKey>` in the messages.
 */
export function CopilotFabContext({
  topicKey,
  seed,
}: {
  topicKey: string;
  seed?: string;
}) {
  const t = useTranslations("copilot");
  const { setFab } = useCopilot();

  const key = `fab.${topicKey}`;
  const label = t.has(key) ? t(key) : null;

  useEffect(() => {
    if (!label) return;
    setFab({ label, seed });
    return () => setFab(null);
  }, [label, seed, setFab]);

  return null;
}
