/**
 * Staff-level admin access for the Copilot review page.
 *
 * We explicitly *don't* give this to every org-admin — the page shows
 * cross-tenant feedback + KB-gap diagnostics, which is a Seentrix-staff
 * concern, not a customer concern. Access is controlled by the
 * `COPILOT_ADMIN_EMAILS` env var, a comma-separated allowlist.
 *
 * Leaving the env var unset means no one has access (safe default).
 */
export function isCopilotAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.COPILOT_ADMIN_EMAILS;
  if (!raw) return false;
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
