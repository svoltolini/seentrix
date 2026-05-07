/**
 * Time-related constants and small helpers used across the app.
 * Centralised so we don't sprinkle `86_400_000` (the magic-number ms-in-a-day)
 * across server actions and client renders.
 */

export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Whole days between a date (string or Date) and now. Negative if `date` is in
 * the past, zero if same day. Uses `Math.ceil` so "23 hours from now" rounds
 * up to 1 day rather than 0.
 */
export function daysUntil(date: string | Date): number {
  const target = typeof date === "string" ? new Date(date) : date;
  return Math.ceil((target.getTime() - Date.now()) / MS_PER_DAY);
}

/**
 * Whole days between a date (string or Date) and now. Always non-negative —
 * counts elapsed days regardless of direction. Uses `Math.floor` so a record
 * created 3 hours ago is "0 days old", not 1.
 */
export function daysSince(date: string | Date): number {
  const start = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / MS_PER_DAY));
}
