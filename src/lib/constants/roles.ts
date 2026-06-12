/**
 * Roles — the single source of truth for what each org role can do, which
 * dashboard it lands on, and the human-readable description shown when
 * inviting people (Settings → Team).
 *
 * Five roles live on `public.users.role`. Permission checks across the
 * server actions historically each declared their own `ROLES_CAN_WRITE`
 * set; new code should import `canWrite` / `isViewer` from here so the
 * rules stay in one place.
 */

export const ROLE_IDS = [
  "admin",
  "compliance_officer",
  "cto",
  "editor",
  "viewer",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export function isRoleId(v: unknown): v is RoleId {
  return typeof v === "string" && (ROLE_IDS as readonly string[]).includes(v);
}

/**
 * Roles allowed to create / edit / delete content. Viewer is strictly
 * read-only — it can open every screen but cannot add or change anything.
 */
const WRITE_ROLES: ReadonlySet<string> = new Set<RoleId>([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);

export function canWrite(role: string | null | undefined): boolean {
  return !!role && WRITE_ROLES.has(role);
}

export function isViewer(role: string | null | undefined): boolean {
  return role === "viewer";
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

// ---------------------------------------------------------------------------
// Dashboard variant
// ---------------------------------------------------------------------------

export type DashboardVariant = "org" | "myWork";

/**
 * Which dashboard a role lands on. Leadership roles (admin, compliance
 * officer, CTO) steer compliance and see the org-wide dashboard; editors
 * are the staff working tasks, so they get the "My Work" dashboard;
 * viewers see the org dashboard read-only. Changing who sees what later is
 * a one-line edit here.
 */
const DASHBOARD_BY_ROLE: Record<RoleId, DashboardVariant> = {
  admin: "org",
  compliance_officer: "org",
  cto: "org",
  editor: "myWork",
  viewer: "org",
};

export function dashboardVariant(role: string | null | undefined): DashboardVariant {
  return isRoleId(role) ? DASHBOARD_BY_ROLE[role] : "org";
}

// ---------------------------------------------------------------------------
// Descriptions (Settings → Team "Roles" reference)
// ---------------------------------------------------------------------------

/**
 * Display order + i18n key stem for each role. Labels and prose live in
 * each locale's settings.json under team.roleGuide.<id>.{summary,who};
 * keeping only the order + permission flags here avoids duplicating copy.
 */
export interface RoleMeta {
  id: RoleId;
  /** Can this role create/edit content? (false only for viewer) */
  canWrite: boolean;
  /** Admin-only capabilities (billing, team management). */
  isAdmin: boolean;
}

export const ROLE_META: RoleMeta[] = [
  { id: "admin", canWrite: true, isAdmin: true },
  { id: "compliance_officer", canWrite: true, isAdmin: false },
  { id: "cto", canWrite: true, isAdmin: false },
  { id: "editor", canWrite: true, isAdmin: false },
  { id: "viewer", canWrite: false, isAdmin: false },
];
