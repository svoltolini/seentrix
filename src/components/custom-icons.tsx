import * as React from "react";

/**
 * Custom Seentrix icons — designs the user supplied that don't exist
 * in iconsax (or that the user explicitly wanted to replace).
 *
 * Each glyph is an inline `<svg>` with `stroke="currentColor"` so it
 * inherits the parent text colour, mirroring how iconsax-react
 * icons behave. Size is driven by the `size` prop (defaults to 24 to
 * match iconsax's default).
 *
 * These are routed through the canonical `<Icon name="..." />`
 * wrapper at `./icon.tsx` — the custom-icon map in that file checks
 * here first, then falls back to iconsax. That means callers stay
 * on the single `<Icon />` API and don't have to know which icons
 * are stock vs custom.
 */

type CustomIconProps = {
  size?: number;
  className?: string;
};

/**
 * Message — chat bubble with three dots. Replaces the iconsax
 * `Message` glyph everywhere we render the comment-count signal so
 * the conversation thread reads with a friendlier silhouette.
 */
export function MessageCustomIcon({ size = 24, className }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19H8C4 19 2 18 2 13V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.9965 11H16.0054"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9955 11H12.0045"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99451 11H8.00349"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Attachment — paperclip / link-arc combo. Replaces iconsax's
 * `AttachCircle` / `AttachSquare` family which the user found too
 * button-shaped. This is the canonical Seentrix attachment glyph.
 */
export function AttachmentCustomIcon({ size = 24, className }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5.75992 8.81L4.54992 10.02C2.20992 12.36 2.20992 16.16 4.54992 18.51"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.33 12.15L9.86005 14.62C8.49005 15.99 8.49005 18.2 9.86005 19.57C11.23 20.94 13.44 20.94 14.81 19.57L18.7 15.68C21.43 12.95 21.43 8.50998 18.7 5.77998C15.97 3.04998 11.53 3.04998 8.80005 5.77998"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Map of custom-icon names → React components. */
export const CUSTOM_ICONS: Record<string, React.FC<CustomIconProps>> = {
  Message: MessageCustomIcon,
  Attachment: AttachmentCustomIcon,
};
