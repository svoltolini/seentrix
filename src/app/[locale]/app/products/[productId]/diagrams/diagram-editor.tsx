"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import type {
  DiagramSaveData,
} from "@/components/diagrams/excalidraw-canvas";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/icon";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIAGRAM_TYPES, type DiagramType } from "./constants";
import { saveDiagram, getDiagramScene } from "./actions";

// Excalidraw is client-only (touches window at import). Load it lazily so it
// never lands in the server bundle and only ships when the editor opens.
const ExcalidrawCanvas = dynamic(
  () =>
    import("@/components/diagrams/excalidraw-canvas").then(
      (m) => m.ExcalidrawCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-muted">
        <Icon name="Refresh" className="animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export interface EditorTarget {
  id: string | null; // null → creating a new diagram
  type: DiagramType;
  title: string;
}

export function DiagramEditor({
  productId,
  target,
  onClose,
  onSaved,
}: {
  productId: string;
  target: EditorTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("diagrams");
  const locale = useLocale();

  const [title, setTitle] = useState(target.title);
  const [type, setType] = useState<DiagramType>(target.type);
  const [initialScene, setInitialScene] =
    useState<ExcalidrawInitialDataState | null>(null);
  const [loadingScene, setLoadingScene] = useState(target.id !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saverRef = useRef<(() => Promise<DiagramSaveData>) | null>(null);

  // Load the existing scene when editing. New diagrams start blank, so
  // `loadingScene` already initialises to false for them (target.id === null).
  useEffect(() => {
    if (target.id === null) return;
    let cancelled = false;
    (async () => {
      const { scene } = await getDiagramScene(target.id!);
      if (cancelled) return;
      if (scene && typeof scene === "object") {
        const s = scene as {
          elements?: unknown;
          appState?: unknown;
          files?: unknown;
        };
        setInitialScene({
          elements: (s.elements ?? []) as ExcalidrawInitialDataState["elements"],
          appState: (s.appState ?? {}) as ExcalidrawInitialDataState["appState"],
          files: (s.files ?? {}) as ExcalidrawInitialDataState["files"],
        });
      }
      setLoadingScene(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [target.id]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const bindSave = useCallback(
    (saver: () => Promise<DiagramSaveData>) => {
      saverRef.current = saver;
    },
    [],
  );

  async function handleSave() {
    if (!title.trim()) {
      setError(t("editor.titleRequired"));
      return;
    }
    if (!saverRef.current) return;
    setSaving(true);
    setError(null);

    const { sceneJson, preview } = await saverRef.current();
    const formData = new FormData();
    if (target.id) formData.set("diagramId", target.id);
    formData.set("type", type);
    formData.set("title", title.trim());
    formData.set(
      "scene",
      new File([sceneJson], "scene.json", { type: "application/json" }),
    );
    if (preview) {
      formData.set("preview", new File([preview], "preview.png", {
        type: "image/png",
      }));
    }

    const result = await saveDiagram(productId, formData);
    setSaving(false);
    if (result.error) {
      const key = `editor.errors.${result.error}`;
      setError(t.has(key) ? t(key) : t("editor.errors.generic"));
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card">
      {/* Header — our chrome; the canvas chrome below stays Excalidraw's. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <IconBadge name="Box" tone="primary" size="md" className="shrink-0" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("editor.titlePlaceholder")}
          className="h-9 max-w-sm"
          aria-label={t("editor.titleLabel")}
        />
        <Select
          value={type}
          onValueChange={(v) => setType(v as DiagramType)}
        >
          <SelectTrigger size="sm" className="w-48">
            <SelectValue>{(v) => (v ? t(`types.${v}`) : "")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIAGRAM_TYPES.map((dt) => (
              <SelectItem key={dt} value={dt}>
                {t(`types.${dt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <span className="text-p4 text-destructive">{error}</span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            {t("editor.close")}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loadingScene}>
            {saving ? t("editor.saving") : t("editor.save")}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1">
        {loadingScene ? (
          <div className="flex size-full items-center justify-center bg-muted">
            <Icon name="Refresh" className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ExcalidrawCanvas
            initialScene={initialScene}
            langCode={locale}
            bindSave={bindSave}
          />
        )}
      </div>
    </div>
  );
}
