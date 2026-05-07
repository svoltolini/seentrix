import type { DocumentType } from "@/app/[locale]/app/products/[productId]/documents/actions";

/**
 * The product is English-only. This module used to switch labels by
 * `Locale`; we keep the export as a thin facade so existing call-sites
 * (`getPdfMessages(locale, type)`) compile without per-route rewrites.
 */
export type Locale = "en";

type PdfMessages = Record<string, string>;

const messages: Record<DocumentType, PdfMessages> = {
  declaration_of_conformity: {
    title: "EU Declaration of Conformity",
    subtitle: "In accordance with Cyber Resilience Act — Annex V",
    section1: "1. Manufacturer",
    manufacturerName: "Name",
    manufacturerAddress: "Address",
    section2: "2. Product with Digital Elements",
    productName: "Product Name",
    productIdentification: "Product Identification",
    section3: "3. Conformity Statement",
    conformityStatement: "Declaration",
    section4: "4. Harmonised Standards and Specifications",
    standardsApplied: "Standards Applied",
    section5: "5. Notified Body (where applicable)",
    notifiedBodyName: "Notified Body Name",
    notifiedBodyNumber: "Notified Body Number",
    section6: "6. Signed",
    place: "Place",
    date: "Date",
    signatoryName: "Name",
    signatoryPosition: "Position",
    signatureLine: "Signature: ____________________________",
  },
  vulnerability_disclosure_policy: {
    title: "Vulnerability Disclosure Policy",
    subtitle: "In accordance with Cyber Resilience Act — Article 11",
    section1: "1. Policy Scope",
    policyScope: "Scope",
    section2: "2. Reporting Channels",
    reportingChannels: "Channels",
    section3: "3. Response Timeline",
    responseTimeline: "Timeline",
    section4: "4. Disclosure Timeline",
    disclosureTimeline: "Timeline",
    section5: "5. Safe Harbor Statement",
    safeHarborStatement: "Statement",
  },
  incident_report: {
    title: "Security Incident Report",
    subtitle: "In accordance with Cyber Resilience Act — Article 14",
    phaseA: "Phase A — Early Warning (within 24 hours)",
    phaseACallout:
      "Must be submitted to ENISA within 24 hours of becoming aware of the incident.",
    incidentTitle: "Incident Title",
    incidentDate: "Incident Date",
    incidentDescription: "Initial Description",
    phaseB: "Phase B — Full Notification (within 72 hours)",
    phaseBCallout:
      "Must be submitted to ENISA within 72 hours of becoming aware of the incident.",
    fullDescription: "Detailed Description",
    impactAssessment: "Impact Assessment",
    phaseC: "Phase C — Final Report (within 14 days)",
    phaseCCallout:
      "Must be submitted to ENISA within 14 days of becoming aware of the incident.",
    mitigationActions: "Mitigation Actions",
    notificationDate: "Notification Date to ENISA",
  },
  risk_assessment: {
    title: "Cybersecurity Risk Assessment",
    subtitle: "Risk Assessment Matrix — CRA Compliance",
    section1: "1. Assessment Overview",
    riskTitle: "Assessment Title",
    section2: "2. Threat Description",
    threatDescription: "Threats",
    section3: "3. Vulnerabilities Identified",
    vulnerabilitiesIdentified: "Vulnerabilities",
    section4: "4. Risk Level",
    riskLevel: "Overall Risk Level",
    section5: "5. Mitigation Plan",
    mitigationPlan: "Mitigation Measures",
    section6: "6. Residual Risk",
    residualRisk: "Remaining Risk",
    riskLevelLow: "Low",
    riskLevelMedium: "Medium",
    riskLevelHigh: "High",
    riskLevelCritical: "Critical",
  },
  technical_documentation: {
    title: "Technical Documentation",
    subtitle: "In accordance with Cyber Resilience Act — Annex VII",
    section1: "1. Scope",
    techDocScope: "Scope",
    section2: "2. Design Description",
    designDescription: "Design",
    section3: "3. Development Process",
    developmentProcess: "Process",
    section4: "4. Testing and Verification",
    testingResults: "Results",
    section5: "5. Update Mechanism",
    updateMechanism: "Mechanism",
    section6: "6. Support Period",
    supportPeriod: "Period",
  },
};

export function getPdfMessages(
  _locale: Locale,
  documentType: DocumentType,
): PdfMessages {
  return messages[documentType];
}
