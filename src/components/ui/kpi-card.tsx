import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icon"

/**
 * KpiCard — Nask metric tile. Used in Project Statistics rail and Dashboard
 * hero strip. Compact card with: label (top), value (large), delta or trend
 * (bottom-right), optional leading icon in a tinted square.
 */
function KpiCard({
  icon,
  iconTone = "primary",
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: IconName
  iconTone?: "primary" | "accent" | "success" | "destructive" | "muted"
  label: string
  value: React.ReactNode
  delta?: React.ReactNode
  deltaTone?: "neutral" | "positive" | "negative"
  hint?: string
}) {
  return (
    <div
      data-slot="kpi-card"
      className={cn(
        "flex flex-col gap-3 rounded-md bg-card p-[18px] shadow-card-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-p3 text-muted-foreground">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-sm",
              iconTone === "primary" && "bg-primary/10 text-primary",
              iconTone === "accent" && "bg-accent/10 text-accent",
              iconTone === "success" && "bg-success/10 text-success",
              iconTone === "destructive" && "bg-destructive/10 text-destructive",
              iconTone === "muted" && "bg-muted text-muted-foreground"
            )}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-h1 text-foreground">{value}</div>
        {delta && (
          <span
            className={cn(
              "text-l6-plus",
              deltaTone === "positive" && "text-success",
              deltaTone === "negative" && "text-destructive",
              deltaTone === "neutral" && "text-muted-foreground"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="text-p4 text-muted-foreground">{hint}</p>}
    </div>
  )
}

export { KpiCard }
