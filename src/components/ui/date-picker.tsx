import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DatePicker — thin wrapper around the native <input type="date"> styled to
 * match the Nask filled-input look. The browser provides a date popover for
 * free; we polish the trigger surface to match other form fields.
 *
 * For richer scheduling (Schedule-page calendar grid, range pickers), build a
 * dedicated <Calendar /> grid component in a later phase.
 */
function DatePicker({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="date"
      data-slot="date-picker"
      className={cn(
        "h-11 w-full min-w-0 rounded-md bg-input px-4 text-p2 text-foreground placeholder:text-muted-foreground border border-border-strong transition-colors outline-none",
        "focus-visible:border-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Style the native date-picker icon so it inherits the foreground tint.
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
        className
      )}
      {...props}
    />
  )
}

export { DatePicker }
