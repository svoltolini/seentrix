import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentType } from "@/app/[locale]/app/products/[productId]/documents/actions";
import { getPdfMessages } from "./i18n/pdf-messages";
import { DOC_DATE_TAG, type DocLocale } from "./doc-locales";
import { DeclarationOfConformityPdf } from "./templates/declaration-of-conformity";
import { VulnerabilityDisclosurePdf } from "./templates/vulnerability-disclosure";
import { IncidentReportPdf } from "./templates/incident-report";
import { RiskAssessmentPdf } from "./templates/risk-assessment";
import { TechnicalDocumentationPdf } from "./templates/technical-documentation";
import { AuthorisedRepresentativeMandatePdf } from "./templates/authorised-representative-mandate";

interface GenerateOptions {
  documentType: DocumentType;
  content: string;
  locale: DocLocale;
}

export async function generatePdfBuffer({
  documentType,
  content,
  locale,
}: GenerateOptions): Promise<Buffer> {
  const data = JSON.parse(content) as Record<string, string>;
  const messages = getPdfMessages(locale, documentType);
  // Format the "generated on" date in the document's output language so it
  // reads naturally in the chosen market language.
  const generatedAt = new Date().toLocaleDateString(DOC_DATE_TAG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const templateMap: Record<DocumentType, React.JSX.Element> = {
    declaration_of_conformity: (
      <DeclarationOfConformityPdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
    vulnerability_disclosure_policy: (
      <VulnerabilityDisclosurePdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
    incident_report: (
      <IncidentReportPdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
    risk_assessment: (
      <RiskAssessmentPdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
    technical_documentation: (
      <TechnicalDocumentationPdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
    authorised_representative_mandate: (
      <AuthorisedRepresentativeMandatePdf
        data={data}
        messages={messages}
        generatedAt={generatedAt}
      />
    ),
  };

  const element = templateMap[documentType];
  return renderToBuffer(element);
}
