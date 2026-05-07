"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Icon } from "@/components/icon"

import { cn } from "@/lib/utils"

/**
 * Checkbox — Nask square. Resting `bg-card border-border-outline`,
 * checked `bg-primary` with white tick.
 */
function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-border-outline bg-card transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/30",
        "data-[checked]:bg-primary data-[checked]:border-primary data-[checked]:text-primary-foreground",
        "hover:border-primary/60",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-current"
      >
        <Icon name="CheckIcon" size={14} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
