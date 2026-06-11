// ---------------------------------------------------------------------------
// Shared color maps — single source of truth for the product domain
// All values use semantic Tailwind tokens from globals.css
// ---------------------------------------------------------------------------

// CRA category badges use the Clay handoff palette: critical terracotta
// (#f4e1da/#a8442f), important II warm gold (#f1e9da/#856231), important I
// muted teal (#e7eef0/#3d6470), default hover-grey/muted.
export const CATEGORY_COLORS: Record<
  string,
  { badge: string; bg: string; icon: string; dot: string }
> = {
  default: {
    badge: "bg-muted text-muted-foreground",
    bg: "bg-muted",
    icon: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  important_class_i: {
    badge: "bg-[#e7eef0] text-[#3d6470]",
    bg: "bg-[#e7eef0]",
    icon: "text-[#3d6470]",
    dot: "bg-[#3d6470]",
  },
  important_class_ii: {
    badge: "bg-[#f1e9da] text-[#856231]",
    bg: "bg-[#f1e9da]",
    icon: "text-[#856231]",
    dot: "bg-[#856231]",
  },
  critical: {
    badge: "bg-[#f4e1da] text-[#a8442f]",
    bg: "bg-[#f4e1da]",
    icon: "text-[#a8442f]",
    dot: "bg-[#a8442f]",
  },
};

export const TYPE_COLORS: Record<string, string> = {
  hardware: "bg-primary/10 text-primary",
  software: "bg-accent/10 text-accent",
  firmware: "bg-success/10 text-success",
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

/** Per-product line colors for trend charts — Nask palette */
export const PRODUCT_LINE_COLORS = [
  "var(--primary)",
  "#c0892e",
  "#FF9E55",
  "var(--accent)",
  "var(--success)",
];

/** Org-wide average line color */
export const ORG_AVERAGE_COLOR = "var(--muted-foreground)";
