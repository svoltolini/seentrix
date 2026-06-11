import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea — same filled-input look as <Input />.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[88px] w-full min-w-0 rounded-md bg-input p-4 text-p2 text-foreground placeholder:text-muted-foreground border border-border-strong transition-[border-color] duration-[140ms] outline-none",
        "focus-visible:border-primary",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/40",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
