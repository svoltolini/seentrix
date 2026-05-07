import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge — Nask pill (12/600). Soft variants use `bg-{color}/10 text-{color}`
 * so they sit gracefully on white cards. Solid variants are reserved for
 * priority badges on tinted backgrounds (project hero cards).
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm px-2 py-1 text-l6-plus whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-foreground [a]:hover:bg-secondary",
        primary:
          "bg-primary/10 text-primary [a]:hover:bg-primary/15",
        accent:
          "bg-accent/10 text-accent [a]:hover:bg-accent/15",
        success:
          "bg-success/10 text-success [a]:hover:bg-success/15",
        warning:
          "bg-accent/10 text-accent [a]:hover:bg-accent/15",
        destructive:
          "bg-destructive/10 text-destructive [a]:hover:bg-destructive/15",
        outline:
          "border-[1.5px] border-border-outline bg-card text-foreground [a]:hover:bg-muted",
        // Solid white pill on tinted bg (e.g. priority chip on a gradient project card).
        "solid-translucent":
          "bg-white/20 text-white",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground hover:bg-muted",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
