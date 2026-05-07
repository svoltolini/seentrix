import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Input — Nask filled style.
 * Per Figma Settings frame `85:10431` form rows: `bg-input rounded-[10px] p-4
 * text-p2`. Borderless at rest; focus thickens to a 1.5px primary ring on a
 * white surface so the field "lifts" into edit mode.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md bg-input px-4 text-p2 text-foreground placeholder:text-muted-foreground border-[1.5px] border-transparent transition-colors outline-none",
        "focus-visible:bg-card focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/40 aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-l6 file:font-semibold file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
