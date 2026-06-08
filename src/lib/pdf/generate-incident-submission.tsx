import { renderToBuffer } from "@react-pdf/renderer";
import {
  IncidentSubmissionPdf,
  type IncidentSubmissionData,
} from "./templates/incident-submission";

/**
 * Dedicated entry for the Article 14 SRP submission package (Phase 4).
 */
export async function generateIncidentSubmissionPdf({
  data,
  messages,
  generatedAt,
}: {
  data: IncidentSubmissionData;
  messages: Record<string, string>;
  generatedAt: string;
}): Promise<Buffer> {
  return renderToBuffer(
    <IncidentSubmissionPdf
      data={data}
      messages={messages}
      generatedAt={generatedAt}
    />,
  );
}
