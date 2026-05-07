"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Label — Nask form-field label.
 *   default: `text-l6` (14/600) — auth forms, compact labels
 *   size="lg":   `text-l4` (18/600) — Settings page form labels (per Figma `85:10431`)
 */
function Label({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"label"> & { size?: "default" | "lg" }) {
  return (
    <label
      data-slot="label"
      data-size={size}
      className={cn(
        "flex items-center gap-2 text-foreground select-none",
        size === "lg" ? "text-l4" : "text-l6",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
