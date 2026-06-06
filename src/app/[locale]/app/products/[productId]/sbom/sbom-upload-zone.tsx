"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

/**
 * SbomUploadZone — drag-and-drop file picker for SBOM uploads.
 *
 * Matches the Figma "Attach File" drop zone (Create Project sheet,
 * frame 173:16444): a primary-tinted dashed rectangle with a 5 %
 * blue fill and a primary-coloured headline "Drag-and-drop files,
 * or Browse". On drag-over the colour intensifies (10 % fill, full
 * primary border).
 *
 * The earlier version painted the dashed border with an inline
 * `<svg>` carrying a linear-gradient stroke (blue → orange) — that
 * was a gradient border, exactly the thing the design memory rule
 * forbids ("palette only, no per-card gradients"). The new layout
 * uses plain Tailwind border classes, no SVG plumbing required.
 */
export function SbomUploadZone({
  onFile,
  uploading,
  uploadError,
}: {
  onFile: (file: File) => void;
  uploading: boolean;
  uploadError: string | null;
}) {
  const t = useTranslations("sbom");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "group/dropzone flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon name="DocumentUpload" size={20} variant="Bold" />
        </span>
        {uploading ? (
          <p className="text-p3 text-muted-foreground">
            {t("upload.uploading")}
          </p>
        ) : (
          <>
            <p className="text-l5 text-foreground">
              {dragOver ? t("upload.dropzoneActive") : t("upload.dropzone")}
            </p>
            <p className="text-p4 text-muted-foreground">
              {t("upload.formats")}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json,.xml"
          className="hidden"
          onChange={handleInputChange}
        />
      </button>
      {uploadError && (
        <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-p3 text-destructive">
          {uploadError}
        </p>
      )}
    </div>
  );
}
