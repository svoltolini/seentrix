"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-6 py-8 text-center transition-colors",
          dragOver ? "bg-primary/5" : "hover:bg-muted",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {/* Gradient dashed border */}
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="drop-border"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#066DE6" stopOpacity={dragOver ? 1 : 0.4} />
              <stop offset="50%" stopColor="#6F4FE0" stopOpacity={dragOver ? 1 : 0.4} />
              <stop offset="100%" stopColor="#FF6D00" stopOpacity={dragOver ? 1 : 0.4} />
            </linearGradient>
          </defs>
          <rect
            x="1"
            y="1"
            rx="11"
            ry="11"
            fill="none"
            stroke="url(#drop-border)"
            strokeWidth="2"
            strokeDasharray="8 5"
            style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
          />
        </svg>

        {uploading ? (
          <p className="text-sm text-muted-foreground">
            {t("upload.uploading")}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              {dragOver ? t("upload.dropzoneActive") : t("upload.dropzone")}
            </p>
            <p className="text-xs text-muted-foreground">
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
      </div>
      {uploadError && (
        <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </p>
      )}
    </div>
  );
}
