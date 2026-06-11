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
        "h-11 w-full min-w-0 rounded-md bg-input px-4 text-p2 text-foreground placeholder:text-muted-foreground border border-border-strong transition-[border-color] duration-[140ms] outline-none",
        "focus-visible:border-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/40",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-l6 file:font-semibold file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
