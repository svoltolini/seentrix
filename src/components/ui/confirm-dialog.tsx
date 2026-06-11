"use client"

import * as React from "react"
import { Icon } from "@/components/icon";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * ConfirmDialog — Nask modal pattern.
 * Soft overlay (foreground @ 20% with blur), white card with `--shadow-card-md`,
 * close affordance top-right. Default destructive intent matches the most
 * common usage (delete / revoke flows).
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = "destructive",
  disabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children?: React.ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  variant?: "destructive" | "default"
  disabled?: boolean
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-150",
            "data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-[18px] shadow-card-md transition duration-200",
            "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-h4 text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <Icon name="XIcon" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description className="mt-2 text-p3 text-muted-foreground">
            {description}
          </DialogPrimitive.Description>

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close
              render={
                <Button variant="outline" size="sm" />
              }
            >
              {cancelLabel}
            </DialogPrimitive.Close>
            <Button
              variant={variant}
              size="sm"
              disabled={disabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { ConfirmDialog }
