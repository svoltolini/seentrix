/**
 * Single source of truth for glossary term IDs, the related-term graph, and
 * the glossary → Academy-lesson mapping. The translated term content lives
 * in messages/en|de/glossary.json under `glossary.<id>.{title,body,ref}`.
 *
 * When you add a new term:
 *   1. Append its snake_case id to GLOSSARY_TERMS below.
 *   2. Add content under glossary.<id> in messages/en/glossary.json and
 *      messages/de/glossary.json.
 *   3. Optionally add it to GLOSSARY_RELATED and GLOSSARY_LESSONS.
 */

export const GLOSSARY_TERMS = [
  // Security vocabulary
  "vulnerability",
  "cve",
  "cvss",
  "epss",
  "kev",
  "actively_exploited",
  "advisory",
  "cvd",
  "psirt",

  // SBOM & supply-chain
  "sbom",
  "cyclonedx",
  "spdx",
  "semver",
  "digest",
  "hash",
  "signing",

  // CRA regulatory vocabulary
  "cra",
  "annex_i",
  "annex_v",
  "annex_vii",
  "article_13",
  "article_14",
  "essential_requirements",
  "conformity_assessment",
  "module_a",
  "module_b_c",
  "module_h",
  "ce_marking",
  "doc",
  "notified_body",
  "nando",
  "authorised_representative",
  "market_surveillance",
  "placing_on_market",

  // Incident-response vocabulary
  "early_warning",
  "incident_report",
  "final_report",
  "triage",
  "severity",
  "enisa",
  "csirt",

  // Product-lifecycle vocabulary
  "support_period",
  "update_channel",
  "release",
  "security_update",

  // Secure-by-design & technical documentation
  "threat_model",
  "data_flow_diagram",

  // Risk assessment
  "risk_assessment",
  "residual_risk",

  // Documentation & retention
  "technical_documentation",
  "retention_period",
] as const;

export type GlossaryTermId = (typeof GLOSSARY_TERMS)[number];

/**
 * Graph of which terms are most useful to jump to from each term. Keep it
 * to 2-4 siblings per term — a long list is noise, not help.
 */
export const GLOSSARY_RELATED: Partial<Record<GlossaryTermId, GlossaryTermId[]>> = {
  vulnerability: ["cve", "cvss", "actively_exploited", "advisory"],
  cve: ["vulnerability", "cvss", "kev", "advisory"],
  cvss: ["cve", "severity", "epss"],
  epss: ["cvss", "kev", "severity"],
  kev: ["actively_exploited", "cve", "cvss"],
  actively_exploited: ["kev", "article_14", "early_warning"],
  advisory: ["cvd", "psirt", "cve"],
  cvd: ["psirt", "advisory", "vulnerability"],
  psirt: ["cvd", "advisory", "support_period"],

  sbom: ["cyclonedx", "spdx", "annex_i", "vulnerability"],
  cyclonedx: ["sbom", "spdx"],
  spdx: ["sbom", "cyclonedx"],
  semver: ["release", "security_update"],
  digest: ["hash", "signing", "release"],
  hash: ["digest", "signing"],
  signing: ["digest", "hash"],

  cra: ["annex_i", "annex_v", "article_13", "article_14"],
  annex_i: ["essential_requirements", "cra", "sbom"],
  annex_v: ["doc", "notified_body", "ce_marking"],
  annex_vii: ["annex_i", "threat_model", "data_flow_diagram", "sbom"],
  article_13: ["support_period", "cra"],
  article_14: ["early_warning", "incident_report", "final_report", "enisa"],
  essential_requirements: ["annex_i", "conformity_assessment"],
  conformity_assessment: ["module_a", "module_b_c", "module_h", "notified_body"],
  module_a: ["conformity_assessment", "module_b_c"],
  module_b_c: ["conformity_assessment", "notified_body", "module_a"],
  module_h: ["conformity_assessment", "notified_body"],
  ce_marking: ["doc", "conformity_assessment", "annex_v"],
  doc: ["ce_marking", "annex_v", "notified_body"],
  notified_body: ["nando", "doc", "module_b_c"],
  nando: ["notified_body"],
  authorised_representative: ["cra", "placing_on_market"],
  market_surveillance: ["doc", "cra"],
  placing_on_market: ["ce_marking", "doc", "cra"],

  early_warning: ["article_14", "incident_report", "enisa"],
  incident_report: ["article_14", "early_warning", "final_report"],
  final_report: ["article_14", "incident_report"],
  triage: ["severity", "cvd", "psirt"],
  severity: ["cvss", "triage"],
  enisa: ["article_14", "csirt", "early_warning"],
  csirt: ["enisa", "incident_report"],

  support_period: ["article_13", "security_update", "update_channel"],
  update_channel: ["support_period", "release", "security_update"],
  release: ["security_update", "semver", "digest"],
  security_update: ["release", "support_period", "article_13"],

  threat_model: ["data_flow_diagram", "annex_vii", "annex_i"],
  data_flow_diagram: ["threat_model", "annex_vii"],

  risk_assessment: ["article_13", "annex_i", "threat_model", "residual_risk"],
  residual_risk: ["risk_assessment", "threat_model"],

  technical_documentation: ["annex_vii", "retention_period", "doc"],
  retention_period: ["technical_documentation", "annex_vii"],
};

/**
 * Glossary term → Academy lesson mapping. Points to lesson ids that will be
 * implemented in Layer 2. For now the lesson pages render a Coming soon
 * placeholder. Keep the id stable — we link to it from glossary side-sheets.
 */
export const GLOSSARY_LESSONS: Partial<Record<GlossaryTermId, string>> = {
  vulnerability: "vulnerability-handling-101",
  cve: "vulnerability-handling-101",
  cvss: "scoring-vulnerabilities",
  epss: "scoring-vulnerabilities",
  kev: "scoring-vulnerabilities",
  actively_exploited: "article-14-reporting",
  cvd: "cvd-and-psirt",
  psirt: "cvd-and-psirt",
  advisory: "cvd-and-psirt",

  sbom: "sbom-fundamentals",
  cyclonedx: "sbom-fundamentals",
  spdx: "sbom-fundamentals",

  cra: "cra-101",
  annex_i: "annex-i-essential-requirements",
  annex_v: "declaration-of-conformity",
  article_13: "support-period-obligations",
  article_14: "article-14-reporting",
  essential_requirements: "annex-i-essential-requirements",
  conformity_assessment: "conformity-assessment-routes",
  module_a: "conformity-assessment-routes",
  module_b_c: "conformity-assessment-routes",
  module_h: "conformity-assessment-routes",
  ce_marking: "declaration-of-conformity",
  doc: "declaration-of-conformity",
  notified_body: "conformity-assessment-routes",
  nando: "conformity-assessment-routes",
  authorised_representative: "economic-operator-roles",
  market_surveillance: "cra-101",
  placing_on_market: "cra-101",

  early_warning: "article-14-reporting",
  incident_report: "article-14-reporting",
  final_report: "article-14-reporting",
  enisa: "article-14-reporting",
  csirt: "article-14-reporting",

  support_period: "support-period-obligations",
  update_channel: "support-period-obligations",
  release: "support-period-obligations",
  security_update: "support-period-obligations",

  annex_vii: "threat-modelling-and-diagrams",
  threat_model: "threat-modelling-and-diagrams",
  data_flow_diagram: "threat-modelling-and-diagrams",

  risk_assessment: "risk-assessment-fundamentals",
  residual_risk: "risk-assessment-fundamentals",

  technical_documentation: "annex-vii-technical-file",
  retention_period: "annex-vii-technical-file",
};

/**
 * Academy lesson registry. Titles + durations are displayed in the side-sheet
 * "Academy" card. Content pages render a Coming soon placeholder for now.
 */
export const ACADEMY_LESSONS = {
  "cra-101": { title: "CRA 101: scope and timeline", duration: "5 min" },
  "annex-i-essential-requirements": {
    title: "Annex I — Essential cybersecurity requirements",
    duration: "10 min",
  },
  "declaration-of-conformity": {
    title: "The Declaration of Conformity",
    duration: "6 min",
  },
  "conformity-assessment-routes": {
    title: "Conformity assessment routes (Module A, B+C, H)",
    duration: "8 min",
  },
  "economic-operator-roles": {
    title: "Economic-operator roles (manufacturer, importer, distributor)",
    duration: "5 min",
  },
  "support-period-obligations": {
    title: "Support period and security-update obligations",
    duration: "5 min",
  },
  "article-14-reporting": {
    title: "Article 14 incident reporting (24h / 72h / 14d)",
    duration: "7 min",
  },
  "vulnerability-handling-101": {
    title: "Vulnerability handling 101",
    duration: "7 min",
  },
  "scoring-vulnerabilities": {
    title: "Scoring vulnerabilities (CVSS, EPSS, KEV)",
    duration: "5 min",
  },
  "sbom-fundamentals": {
    title: "SBOM fundamentals (CycloneDX, SPDX, Annex I)",
    duration: "5 min",
  },
  "cvd-and-psirt": {
    title: "Coordinated vulnerability disclosure and PSIRT",
    duration: "6 min",
  },
  "threat-modelling-and-diagrams": {
    title: "Threat modelling, diagrams and Annex VII evidence",
    duration: "8 min",
  },
  "risk-assessment-fundamentals": {
    title: "How to do the CRA risk assessment",
    duration: "9 min",
  },
  "annex-vii-technical-file": {
    title: "The Annex VII technical file & retention",
    duration: "8 min",
  },
} satisfies Record<string, { title: string; duration: string }>;

export type AcademyLessonId = keyof typeof ACADEMY_LESSONS;

export function isGlossaryTermId(value: string): value is GlossaryTermId {
  return (GLOSSARY_TERMS as readonly string[]).includes(value);
}
