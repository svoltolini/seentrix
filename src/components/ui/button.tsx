import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — Nask design system.
 * Geometry per Figma frames `49:1675` (in-card primary, h:44 r:8) and
 * `57:26810` ("+ New Project" top-bar, h:48 r:10 dark navy).
 *
 * Variant guide:
 *   default     — in-card primary CTA. Blue, h:44 r:8.
 *   dark        — top-bar "+ New Project". Dark navy, h:48 r:10.
 *   secondary   — passive secondary like "Add a Card". Gray, hug, r:10.
 *   outline     — white card with thin border. r:8.
 *   ghost       — transparent, hover muted.
 *   destructive — red.
 *   link        — text-only.
 */
const buttonVariants = cva(
  // Reset / shared bits — flat (no scale-on-press), focus-visible ring is the
  // primary token at low alpha. SVG sizing rule is centralised here.
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        dark:
          "bg-dark-cta text-dark-cta-foreground hover:bg-dark-cta/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "bg-card text-foreground border-[1.5px] border-border-outline hover:bg-muted",
        ghost:
          "bg-transparent text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Nask buttons are flat horizontal pills. Sizes by height + radius.
        // Use Tailwind's standard `text-{size}` classes here (not the custom
        // `text-l5`/`text-l6` utilities) so tailwind-merge can correctly
        // dedupe text classes and not strip the variant's text colour.
        xs:
          "h-7 gap-1 rounded-sm px-2 text-xs leading-[1.3] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm:
          "h-9 gap-1.5 rounded-sm px-3 text-sm leading-[1.3] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "h-11 gap-3.5 rounded-sm px-[22px] text-base leading-[1.3] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        lg:
          "h-12 gap-3.5 rounded-md px-[75px] text-base leading-[1.3] has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon:
          "size-11 rounded-sm",
        "icon-sm":
          "size-9 rounded-sm [&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
