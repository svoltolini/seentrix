import { Icon, type IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * IconBadge — the app-wide standard for an icon sitting inside a coloured
 * background chip.
 *
 * Standard (matches the Help-Centre AI intro feature list): a rounded chip
 * tinted with the tone colour at 10% opacity, containing a FILLED (iconsax
 * `Bold`) icon in the solid tone colour. Using the filled variant inside the
 * chip reads as more deliberate and on-brand than the thin stroke icons we
 * used before.
 *
 * Use this anywhere an icon needs a coloured background. Plain inline icons
 * (no background) keep the default stroke `<Icon />`.
 */
type Tone = "primary" | "success" | "accent" | "warning" | "destructive" | "muted";

// Soft (default): tinted chip + solid-colour icon. Used everywhere.
const TONE: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

// Solid: filled chip in the tone colour with the foreground icon — matches the
// Help-Centre widget's solid orange icon. Use for a more prominent affordance.
const TONE_SOLID: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  accent: "bg-accent text-accent-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  muted: "bg-muted-foreground text-card",
};

// Chip size → (box class, icon px). Keeps the icon proportional to the chip.
const SIZES = {
  sm: { box: "size-8", icon: 16 },
  md: { box: "size-9", icon: 18 },
  lg: { box: "size-11", icon: 20 },
  xl: { box: "size-12", icon: 22 },
} as const;

export function IconBadge({
  name,
  tone = "primary",
  size = "md",
  shape = "rounded",
  fill = "soft",
  iconSize,
  className,
  iconClassName,
}: {
  name: IconName | (string & {});
  tone?: Tone;
  size?: keyof typeof SIZES;
  /** `rounded` = rounded-md (default), `circle` = fully round. */
  shape?: "rounded" | "circle";
  /** `soft` = tinted chip (default), `solid` = filled tone chip. */
  fill?: "soft" | "solid";
  /** Override the icon's pixel size (defaults to the size preset's icon px). */
  iconSize?: number;
  className?: string;
  iconClassName?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        shape === "circle" ? "rounded-full" : "rounded-md",
        s.box,
        fill === "solid" ? TONE_SOLID[tone] : TONE[tone],
        className,
      )}
    >
      <Icon
        name={name}
        size={iconSize ?? s.icon}
        variant="Bold"
        className={iconClassName}
      />
    </span>
  );
}
