"use client";

import { useEffect, useRef } from "react";
import {
  Excalidraw,
  exportToBlob,
  serializeAsJSON,
  loadFromBlob,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

// The branded BinaryFileData / FileId / skeleton types aren't re-exported
// from the package's public subpaths, so we cast call arguments through the
// functions' own parameter types instead of naming the brands directly.
type AddFilesArg = Parameters<ExcalidrawImperativeAPI["addFiles"]>[0];
type ConvertArg = Parameters<typeof convertToExcalidrawElements>[0];

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

type ImportResult = { ok: boolean; reason?: "unsupported" | "empty" | "error" };

/**
 * Import surface handed to the parent so the editor toolbar can bring
 * existing diagrams onto the canvas:
 *   - `importFile`   loads an `.excalidraw` scene (or a scene-embedded PNG/SVG)
 *                    as fully-editable shapes; a plain image is embedded as a
 *                    picture to annotate.
 *   - `insertMermaid` converts Mermaid text (e.g. AI-generated) into editable
 *                    Excalidraw shapes and adds them to the current scene.
 */
export interface DiagramImportApi {
  importFile: (file: File) => Promise<ImportResult>;
  insertMermaid: (text: string) => Promise<ImportResult>;
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function imageDims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 480, h: img.naturalHeight || 360 });
    img.onerror = () => resolve({ w: 480, h: 360 });
    img.src = dataUrl;
  });
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
  bindImport,
}: {
  initialScene?: ExcalidrawInitialDataState | null;
  langCode?: string;
  bindSave: (saver: () => Promise<DiagramSaveData>) => void;
  bindImport?: (api: DiagramImportApi) => void;
}) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const boundRef = useRef(false);

  useEffect(() => {
    if (boundRef.current) return;
    boundRef.current = true;

    bindImport?.({
      importFile: async (file) => {
        const api = apiRef.current;
        if (!api) return { ok: false, reason: "error" };
        // First try to load it as an Excalidraw scene — handles `.excalidraw`
        // and PNG/SVG that Excalidraw exported with the scene embedded.
        try {
          const restored = await loadFromBlob(file, null, null);
          api.updateScene({ elements: restored.elements, appState: restored.appState });
          if (restored.files) api.addFiles(Object.values(restored.files));
          api.scrollToContent(restored.elements, { fitToContent: true });
          return { ok: true };
        } catch {
          // Not a scene — embed a plain image as an annotatable picture.
          if (!file.type.startsWith("image/")) return { ok: false, reason: "unsupported" };
          try {
            const dataUrl = await readDataUrl(file);
            const { w, h } = await imageDims(dataUrl);
            const scale = Math.min(1, 700 / Math.max(w, h));
            const fileId = crypto.randomUUID();
            api.addFiles([
              {
                id: fileId,
                dataURL: dataUrl,
                mimeType: file.type,
                created: Date.now(),
              },
            ] as unknown as AddFilesArg);
            const els = convertToExcalidrawElements([
              {
                type: "image",
                fileId,
                x: 80,
                y: 80,
                width: Math.round(w * scale),
                height: Math.round(h * scale),
              },
            ] as unknown as ConvertArg);
            api.updateScene({ elements: [...api.getSceneElements(), ...els] });
            api.scrollToContent(els, { fitToContent: true });
            return { ok: true };
          } catch {
            return { ok: false, reason: "error" };
          }
        }
      },
      insertMermaid: async (text) => {
        const api = apiRef.current;
        if (!api) return { ok: false, reason: "error" };
        const trimmed = text.trim();
        if (!trimmed) return { ok: false, reason: "empty" };
        try {
          // Heavy (pulls in mermaid) — load only when actually used.
          const { parseMermaidToExcalidraw } = await import(
            "@excalidraw/mermaid-to-excalidraw"
          );
          const { elements, files } = await parseMermaidToExcalidraw(trimmed);
          const converted = convertToExcalidrawElements(
            elements as unknown as ConvertArg,
          );
          if (converted.length === 0) return { ok: false, reason: "empty" };
          api.updateScene({ elements: [...api.getSceneElements(), ...converted] });
          if (files) {
            api.addFiles(Object.values(files) as unknown as AddFilesArg);
          }
          api.scrollToContent(converted, { fitToContent: true });
          return { ok: true };
        } catch {
          return { ok: false, reason: "error" };
        }
      },
    });

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
  }, [bindSave, bindImport]);

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
