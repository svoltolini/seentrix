import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Input — Clay text field (design `.sx-input`): a WHITE field with a hairline
 * line-strong border, radius ~11, that turns its border accent-green on focus.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md bg-input px-4 text-p2 text-foreground placeholder:text-muted-foreground border-[1.5px] border-border-strong transition-colors outline-none",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/15",
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
