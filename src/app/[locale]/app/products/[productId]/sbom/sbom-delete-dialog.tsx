"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HugeIcon } from "@/components/huge-icon";
import type { SbomRecord } from "./actions";

export function SbomDeleteDialog({
  target,
  onClose,
  onConfirm,
  disabled,
}: {
  target: SbomRecord | null;
  onClose: () => void;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("sbom");

  return (
    <ConfirmDialog
      open={!!target}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t("list.deleteConfirm")}
      description={t("list.deleteDescription")}
      confirmLabel={disabled ? t("list.deleting") : t("list.deleteSubmit")}
      cancelLabel={t("list.deleteCancel")}
      onConfirm={onConfirm}
      disabled={disabled}
    >
      {target && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <HugeIcon name="package" size={16} className="shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {target.file_name}
          </span>
        </div>
      )}
    </ConfirmDialog>
  );
}
