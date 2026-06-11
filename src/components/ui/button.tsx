import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { isValidElement } from "react"

import { cn } from "@/lib/utils"

/**
 * Base UI's button primitive defaults `nativeButton` to `true`, which
 * tells it to render a real `<button>`. When we pass `render={<a />}`
 * (the "this button should act as a link" pattern), Base UI emits a
 * console warning at runtime — the native-button semantics conflict
 * with rendering an anchor.
 *
 * This helper sniffs the `render` prop and infers when the caller is
 * delegating to a non-button element so we can flip `nativeButton` to
 * `false` automatically. Anything that isn't a literal `<button>`
 * element (including `<a>`, `<Link>`, custom components) is assumed
 * to produce non-native markup. Callers who genuinely want native
 * semantics with a custom render can still override by passing
 * `nativeButton` explicitly.
 */
export function inferNativeButton(render: unknown): boolean {
  if (!render) return true;
  if (!isValidElement(render)) return true;
  return render.type === "button";
}

/**
 * Button — Clay design system.
 *
 * The white (ghost/outline) button is THE unified secondary across the app
 * (Export, Download, Manage, Ask/Open Copilot, …): white surface, ink text,
 * 1px line-strong border, 12px radius; on hover ONLY the background changes
 * to the warm hover fill. The solid green primary is the same shape with the
 * accent background and white text/icon. Icons render at currentColor.
 *
 * Variant guide:
 *   default     — solid green primary CTA.
 *   outline     — the unified white button (spec above).
 *   ghost       — borderless tertiary; hover muted fill.
 *   dark        — ink panel CTA.
 *   secondary   — passive grey fill.
 *   destructive — red.
 *   link        — text-only.
 */
const buttonVariants = cva(
  // Shared base — inline-flex, 600 weight, currentColor icons, `transition:
  // all .15s`, focus-visible ring for keyboard users only.
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_88%,#000)]",
        dark:
          "bg-dark-cta text-dark-cta-foreground hover:bg-[color-mix(in_srgb,var(--dark-cta)_85%,#fff)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_92%,#000)]",
        accent:
          "bg-accent text-accent-foreground hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)]",
        outline:
          "bg-card text-foreground border border-border-strong hover:bg-muted",
        ghost:
          "bg-transparent text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_88%,#000)]",
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Geometry per the unified spec: default ≈ 11px 18px / r12 / 13.5px;
        // sm = 8px 13px / r10 / 12.5px with a 7px gap.
        xs:
          "h-7 gap-1 rounded-sm px-2 text-xs leading-[1.3] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm:
          "h-9 gap-[7px] rounded-[10px] px-[13px] text-[12.5px] leading-[1.3] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "h-10 gap-2 rounded-md px-[18px] text-[13.5px] leading-[1.3] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        lg:
          "h-12 gap-2 rounded-md px-7 text-[15px] leading-[1.3] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon:
          "size-10 rounded-md",
        "icon-sm":
          "size-9 rounded-[10px] [&_svg:not([class*='size-'])]:size-4",
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
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      render={render}
      nativeButton={nativeButton ?? inferNativeButton(render)}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
