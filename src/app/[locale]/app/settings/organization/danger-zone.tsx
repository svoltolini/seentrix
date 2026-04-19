"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { HugeIcon } from "@/components/huge-icon";
import {
  exportOrgData,
  requestOrgDeletion,
  cancelOrgDeletion,
} from "../gdpr-actions";
import type { DeletionStatus } from "../gdpr-types";

export function DangerZone({
  orgName,
  orgId,
  deletion,
}: {
  orgName: string;
  orgId: string;
  deletion: DeletionStatus | null;
}) {
  const t = useTranslations("settings.organization.dangerZone");
  const router = useRouter();
  const { toast } = useToast();
  const [exporting, startExport] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  function handleExport() {
    startExport(async () => {
      const result = await exportOrgData();
      if (result.error || !result.json) {
        toast({ type: "error", message: t("exportError") });
        return;
      }
      // Stream the JSON payload as a local download. We include the date in
      // the filename so repeat exports don't clobber each other.
      const blob = new Blob([result.json], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `seentrix-${orgId.slice(0, 8)}-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ type: "success", message: t("exportReady") });
    });
  }

  function handleRequestDeletion() {
    startTransition(async () => {
      const result = await requestOrgDeletion(confirmName);
      if (result?.error === "confirmationMismatch") {
        toast({ type: "error", message: t("confirmationMismatch") });
        return;
      }
      if (result?.error) {
        toast({ type: "error", message: t("deleteError") });
        return;
      }
      setDeleteOpen(false);
      setConfirmName("");
      toast({ type: "success", message: t("deleteScheduled") });
      router.refresh();
    });
  }

  function handleCancelDeletion() {
    startTransition(async () => {
      const result = await cancelOrgDeletion();
      if (result?.error) {
        toast({ type: "error", message: t("cancelError") });
        return;
      }
      toast({ type: "success", message: t("cancelSuccess") });
      router.refresh();
    });
  }

  const isPendingDeletion = !!deletion?.requestedAt;

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      {/* Match the other Settings cards — neutral header, no destructive
          tint on the container. The destructive affordance lives on the
          "Delete" button itself, not on the whole card. */}
      <div className="border-b border-white/[0.06] px-6 py-4">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {t("subtitle")}
        </p>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {/* Export — GDPR Art. 20 */}
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium text-foreground">
              {t("exportTitle")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t("exportDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || isPending}
            className="shrink-0"
          >
            {exporting ? t("exportInProgress") : t("exportCta")}
          </Button>
        </div>

        {/* Delete — GDPR Art. 17 */}
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-4">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/15 text-destructive"
              >
                <HugeIcon name="alert-02" size={11} />
              </span>
              {t("deleteTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {t("deleteDescription")}
            </p>
          </div>
          {isPendingDeletion ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDeletion}
              disabled={isPending}
              className="shrink-0"
            >
              {isPending ? t("cancellingDeletion") : t("cancelDeletion")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
              className="shrink-0"
            >
              {t("deleteCta")}
            </Button>
          )}
        </div>

        {/* Pending deletion banner — only appears when deletion is actually
            scheduled. This is where the destructive tint belongs because
            it's an active warning, not a theoretical one. */}
        {isPendingDeletion && (
          <div className="flex items-start gap-3 bg-destructive/[0.08] px-6 py-4">
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/20 text-destructive"
            >
              <HugeIcon name="alert-02" size={11} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-destructive">
                {t("pendingTitle", {
                  days: deletion?.daysRemaining ?? 0,
                })}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                {t("pendingSubtitle", {
                  date: new Date(deletion!.purgeAt!).toLocaleDateString(),
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog — name typed match prevents accidents. */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setConfirmName("");
        }}
        title={t("dialogTitle")}
        description={t("dialogDescription")}
        confirmLabel={isPending ? t("deleting") : t("dialogConfirm")}
        cancelLabel={t("dialogCancel")}
        onConfirm={handleRequestDeletion}
        disabled={isPending || confirmName.trim() !== orgName}
      >
        <div className="space-y-2">
          <Label htmlFor="confirm-org-name" className="text-xs">
            {t("dialogPromptLabel", { name: orgName })}
          </Label>
          <Input
            id="confirm-org-name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={orgName}
            autoComplete="off"
            autoFocus
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
