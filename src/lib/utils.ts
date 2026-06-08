import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Our design system defines custom typography utilities in `globals.css`
 * (`@layer utilities`): headings `text-h1..h6` (+ `text-h6-plus`), labels
 * `text-l1..l6` (+ `text-l6-plus`), and paragraphs `text-p1..p4` (with `-m`/`-r`
 * weight variants). Each bakes in a font-size, weight, and line-height.
 *
 * Out of the box, `tailwind-merge` only knows about Tailwind's own `text-*`
 * size scale, so it lumps our `text-h6` into the SAME conflict group as text
 * COLORS like `text-foreground`. That means `cn("text-h6", "text-foreground")`
 * would drop `text-h6` entirely (last-wins within a group) — silently killing
 * the bold+small look and falling back to the default paragraph size. This bit
 * us on the dashboard step titles vs. the "Ask Seentrix AI" banner (which used
 * a plain string and was unaffected).
 *
 * Registering our custom names under the `font-size` class group teaches
 * tailwind-merge that they're sizes, not colors, so a size + a color can
 * coexist. The conflict resolution within `font-size` (one size wins) and the
 * separation from `text-color` are then both correct.
 */
const TYPOGRAPHY_SIZES = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "h6-plus",
  "l1",
  "l2",
  "l3",
  "l4",
  "l5",
  "l6",
  "l6-plus",
  "p1",
  "p1-m",
  "p2",
  "p2-r",
  "p3",
  "p3-r",
  "p4",
  "p4-r",
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TYPOGRAPHY_SIZES] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
