import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icon"

/**
 * EmptyState — for "no results", 404, error boundaries.
 * Centered illustration / icon + title + body + optional CTA. White card so
 * it sits gracefully inside a surface or page.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: IconName
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md bg-card px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon name={icon} size={28} variant="Bold" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-h4 text-foreground">{title}</h3>
        {description && (
          <p className="max-w-md text-p3 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
