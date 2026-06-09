/**
 * Display helpers for the admin console. Money is shown as a blended € figure
 * (every currency charges the same number — see metrics.ts), with cents only
 * when the value is small enough to need them.
 */

export function formatEur(n: number, opts?: { cents?: boolean }): string {
  const cents = opts?.cents ?? false;
  return `€${n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
