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
        "min-h-[88px] w-full min-w-0 rounded-md bg-input p-4 text-p2 text-foreground placeholder:text-muted-foreground border-[1.5px] border-border-strong transition-colors duration-150 outline-none",
        "hover:border-border-hover focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/40 aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
