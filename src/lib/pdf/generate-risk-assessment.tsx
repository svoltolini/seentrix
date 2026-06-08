import { renderToBuffer } from "@react-pdf/renderer";
import {
  RiskAssessmentMatrixPdf,
  type RaPdfData,
} from "./templates/risk-assessment-matrix";

/**
 * Dedicated PDF entry for the structured (Phase-2) risk assessment. The
 * generic `generatePdfBuffer` pipeline takes a flat `Record<string,string>`
 * keyed by document type and is still used by the legacy documents; the
 * structured assessment has a richer (context + per-requirement) shape, so it
 * gets its own renderer that reuses the same PDF chrome.
 */
export async function generateRiskAssessmentPdf({
  data,
  messages,
  generatedAt,
}: {
  data: RaPdfData;
  messages: Record<string, string>;
  generatedAt: string;
}): Promise<Buffer> {
  return renderToBuffer(
    <RiskAssessmentMatrixPdf
      data={data}
      messages={messages}
      generatedAt={generatedAt}
    />,
  );
}
