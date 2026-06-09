/**
 * Map from Seentrix screen → the lessons that explain it.
 *
 * Feeds the "By Screen" tab on the Academy page and the contextual
 * training banners shown at the top of each screen. Keep lesson lists
 * short (2-4 entries) — the goal is pointing users at the most relevant
 * material, not dumping the whole catalogue.
 */

export const SCREEN_LESSONS = {
  dashboard: {
    key: "dashboard",
    href: "/app/dashboard",
    icon: "package",
    lessons: ["cra-101"],
  },
  products: {
    key: "products",
    href: "/app/products",
    icon: "package-open-stroke-rounded",
    lessons: [
      "cra-101",
      "annex-i-essential-requirements",
      "conformity-assessment-routes",
    ],
  },
  sbom: {
    key: "sbom",
    href: "/app/products",
    icon: "chip-stroke-rounded",
    lessons: ["sbom-fundamentals", "vulnerability-handling-101"],
  },
  vulnerabilities: {
    key: "vulnerabilities",
    href: "/app/products",
    icon: "shield-check",
    lessons: [
      "vulnerability-handling-101",
      "scoring-vulnerabilities",
      "article-14-reporting",
    ],
  },
  conformity: {
    key: "conformity",
    href: "/app/products",
    icon: "task-done-02-stroke-rounded",
    lessons: [
      "conformity-assessment-routes",
      "declaration-of-conformity",
      "annex-i-essential-requirements",
    ],
  },
  identity: {
    key: "identity",
    href: "/app/products",
    icon: "barcode-stroke-rounded",
    lessons: [
      "ce-marking-and-simplified-doc",
      "annex-ii-user-information",
      "declaration-of-conformity",
    ],
  },
  lifecycle: {
    key: "lifecycle",
    href: "/app/products",
    icon: "recycle-01-stroke-rounded",
    lessons: [
      "post-market-monitoring-supply-chain",
      "end-of-support-corrective-action",
      "conformity-modules",
    ],
  },
  readiness: {
    key: "readiness",
    href: "/app/products",
    icon: "Grid2",
    lessons: ["cra-readiness-overview", "annex-vii-technical-file", "cra-101"],
  },
  diagrams: {
    key: "diagrams",
    href: "/app/products",
    icon: "Category",
    lessons: [
      "threat-modelling-and-diagrams",
      "annex-i-essential-requirements",
    ],
  },
  "risk-assessment": {
    key: "risk-assessment",
    href: "/app/products",
    icon: "ShieldTick",
    lessons: [
      "risk-assessment-fundamentals",
      "annex-i-essential-requirements",
      "threat-modelling-and-diagrams",
    ],
  },
  "technical-file": {
    key: "technical-file",
    href: "/app/products",
    icon: "DocumentText",
    lessons: [
      "annex-vii-technical-file",
      "sbom-fundamentals",
      "annex-i-essential-requirements",
    ],
  },
  releases: {
    key: "releases",
    href: "/app/products",
    icon: "circle-arrow-right-double-stroke-rounded",
    lessons: ["support-period-obligations"],
  },
  incidents: {
    key: "incidents",
    href: "/app/incidents",
    icon: "alert-02",
    lessons: [
      "article-14-reporting",
      "enisa-single-reporting-platform",
      "vulnerability-handling-101",
    ],
  },
  reports: {
    key: "reports",
    href: "/app/vulnerability-reports",
    icon: "shield-check",
    lessons: ["cvd-and-psirt", "vulnerability-handling-101"],
  },
  settingsOrganization: {
    key: "settingsOrganization",
    href: "/app/settings/organization",
    icon: "settings-02",
    lessons: ["declaration-of-conformity"],
  },
  settingsEntity: {
    key: "settingsEntity",
    href: "/app/settings/entity",
    icon: "crown-stroke-rounded",
    lessons: ["economic-operator-roles", "cra-101"],
  },
  settingsTeam: {
    key: "settingsTeam",
    href: "/app/settings/team",
    icon: "one-circle-stroke-rounded",
    lessons: ["cra-101"],
  },
} as const satisfies Record<
  string,
  {
    key: string;
    href: string;
    icon: string;
    lessons: string[];
  }
>;

export type ScreenKey = keyof typeof SCREEN_LESSONS;
