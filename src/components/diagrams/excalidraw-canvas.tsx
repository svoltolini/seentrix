"use client";

import { useEffect, useRef } from "react";
import {
  Excalidraw,
  exportToBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

// Excalidraw resolves its bundled fonts relative to this global. We self-host
// the Latin font set under /public/excalidraw-assets/fonts (see the Phase-1
// build step) so the editor works without any third-party CDN. Font-load
// failures are non-fatal — Excalidraw falls back to system fonts.
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string;
  }
}
if (typeof window !== "undefined") {
  window.EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
}

/** What a Save produces: the serialized scene + an optional PNG preview. */
export interface DiagramSaveData {
  sceneJson: string;
  preview: Blob | null;
}

/**
 * Client-only Excalidraw editor.
 *
 * Loaded via `next/dynamic(..., { ssr: false })` from the editor dialog —
 * Excalidraw touches `window`/`document` at import time and cannot be
 * server-rendered.
 *
 * Rather than forward a ref through `next/dynamic` (which is brittle), the
 * parent passes `bindSave`: on mount we hand it an async `() => DiagramSaveData`
 * closure it can call when the user clicks Save.
 */
export function ExcalidrawCanvas({
  initialScene,
  langCode = "en",
  bindSave,
}: {
  initialScene?: ExcalidrawInitialDataState | null;
  langCode?: string;
  bindSave: (saver: () => Promise<DiagramSaveData>) => void;
}) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const boundRef = useRef(false);

  useEffect(() => {
    if (boundRef.current) return;
    boundRef.current = true;
    bindSave(async () => {
      const api = apiRef.current;
      if (!api) return { sceneJson: "", preview: null };
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      const sceneJson = serializeAsJSON(elements, appState, files, "local");

      let preview: Blob | null = null;
      try {
        preview = await exportToBlob({
          elements,
          appState: { ...appState, exportBackground: true },
          files,
          mimeType: "image/png",
        });
      } catch {
        preview = null;
      }
      return { sceneJson, preview };
    });
  }, [bindSave]);

  return (
    <div className="size-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={
          initialScene
            ? { ...initialScene, scrollToContent: true }
            : undefined
        }
        langCode={langCode}
        theme="light"
        UIOptions={{
          canvasActions: {
            // We own save/persist via Supabase, so hide Excalidraw's own
            // load/save-to-file actions to avoid a confusing second path.
            loadScene: false,
            saveToActiveFile: false,
            export: false,
          },
        }}
      />
    </div>
  );
}
