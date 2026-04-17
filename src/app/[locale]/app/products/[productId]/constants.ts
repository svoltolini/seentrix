// ---------------------------------------------------------------------------
// Shared color maps — single source of truth for the product domain
// All values use semantic Tailwind tokens from globals.css
// ---------------------------------------------------------------------------

export const CATEGORY_COLORS: Record<
  string,
  { badge: string; bg: string; icon: string; dot: string }
> = {
  default: {
    badge: "bg-success/10 text-success",
    bg: "bg-success/10",
    icon: "text-success",
    dot: "bg-success",
  },
  important_class_i: {
    badge: "bg-warning/10 text-warning",
    bg: "bg-warning/10",
    icon: "text-warning",
    dot: "bg-warning",
  },
  important_class_ii: {
    badge: "bg-destructive/10 text-destructive",
    bg: "bg-destructive/10",
    icon: "text-destructive",
    dot: "bg-destructive",
  },
  critical: {
    badge: "bg-destructive/10 text-destructive",
    bg: "bg-destructive/10",
    icon: "text-destructive",
    dot: "bg-destructive",
  },
};

export const TYPE_COLORS: Record<string, string> = {
  hardware: "bg-info/10 text-info",
  software: "bg-lavender/10 text-lavender",
  firmware: "bg-primary/10 text-primary",
  iot: "bg-destructive/10 text-destructive",
};

export const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive",
  high: "bg-warning/10 text-warning",
  medium: "bg-info/10 text-info",
  low: "bg-muted text-muted-foreground",
};

export const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-muted-foreground/40",
};

/** Hex values for recharts (reads CSS custom properties at runtime) */
export const SEVERITY_CHART_COLORS: Record<string, string> = {
  critical: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--info)",
  low: "var(--muted-foreground)",
};

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-primary";
}

export const PRODUCT_TYPES = ["hardware", "software", "firmware", "iot"] as const;

/** Checklist status colors for recharts */
export const STATUS_CHART_COLORS: Record<string, string> = {
  completed: "var(--success)",
  in_progress: "var(--warning)",
  pending: "var(--muted-foreground)",
  not_applicable: "var(--border)",
};

/** Per-product line colors for trend charts */
export const PRODUCT_LINE_COLORS = [
  "#3B82F6", "#8B5CF6", "#06B6D4", "#F9C248", "#22C55E",
];

/** Org-wide average line color */
export const ORG_AVERAGE_COLOR = "var(--muted-foreground)";
