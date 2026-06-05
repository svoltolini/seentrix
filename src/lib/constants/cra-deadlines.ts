/**
 * Canonical CRA (Regulation (EU) 2024/2847) regulatory milestones.
 *
 * Single source of truth for the three statutory dates the product surfaces
 * (dashboard calendar tracker, upcoming-deadlines list, Copilot project-state
 * guidance). Previously these dates were inlined in `dashboard-content.tsx`
 * and the marketing timeline; centralising them keeps every surface in sync.
 *
 * Dates are the EU CRA application milestones:
 *   - 2026-06-11  Notified-body / conformity-assessment provisions apply
 *   - 2026-09-11  Reporting obligations (Article 14) start applying
 *   - 2027-12-11  Full application — all CRA obligations in force
 *
 * `id` doubles as the i18n key suffix under `dashboard.deadline.*`.
 */

export interface CraDeadline {
  /** Stable id; also the i18n key suffix (`dashboard.deadline.<id>`). */
  id: "notified-bodies" | "reporting" | "full-compliance";
  /** i18n key for the human label under `dashboard.deadline`. */
  labelKey: "notifiedBodies" | "reporting" | "fullCompliance";
  /** ISO date (YYYY-MM-DD) of the milestone. */
  date: string;
}

export const CRA_DEADLINES: readonly CraDeadline[] = [
  { id: "notified-bodies", labelKey: "notifiedBodies", date: "2026-06-11" },
  { id: "reporting", labelKey: "reporting", date: "2026-09-11" },
  { id: "full-compliance", labelKey: "fullCompliance", date: "2027-12-11" },
] as const;

/**
 * Return the CRA deadlines that have not yet passed, soonest first. A
 * deadline whose date is today or in the past is dropped.
 */
export function upcomingCraDeadlines(now: Date = new Date()): CraDeadline[] {
  const todayMs = now.getTime();
  return CRA_DEADLINES.filter((d) => new Date(d.date).getTime() > todayMs).sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}

/**
 * The single next CRA deadline (soonest future milestone), or `null` if all
 * statutory dates are in the past.
 */
export function nextCraDeadline(now: Date = new Date()): CraDeadline | null {
  return upcomingCraDeadlines(now)[0] ?? null;
}
