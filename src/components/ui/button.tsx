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
  // Claude UI/UX interaction parameters: a calm 150ms colour transition; solid
  // fills darken on hover (mix toward black, not opacity) and darken again on
  // active for a crisp press; bordered variants darken their border on hover.
  // Focus-visible shows a clear ring. SVG sizing rule centralised here.
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_88%,#000)] active:bg-[color-mix(in_srgb,var(--primary)_78%,#000)]",
        dark:
          "bg-dark-cta text-dark-cta-foreground hover:bg-[color-mix(in_srgb,var(--dark-cta)_85%,#fff)] active:bg-[color-mix(in_srgb,var(--dark-cta)_78%,#fff)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_92%,#000)] active:bg-[color-mix(in_srgb,var(--secondary)_86%,#000)]",
        accent:
          "bg-accent text-accent-foreground hover:bg-[color-mix(in_srgb,var(--accent)_88%,#000)] active:bg-[color-mix(in_srgb,var(--accent)_78%,#000)]",
        outline:
          "bg-card text-foreground border-[1.5px] border-border-strong hover:bg-muted active:bg-[color-mix(in_srgb,var(--muted)_92%,#000)]",
        ghost:
          "bg-transparent text-foreground hover:bg-muted active:bg-[color-mix(in_srgb,var(--muted)_92%,#000)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_88%,#000)] active:bg-[color-mix(in_srgb,var(--destructive)_78%,#000)]",
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
