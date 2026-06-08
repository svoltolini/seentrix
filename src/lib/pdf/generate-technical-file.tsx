import { renderToBuffer } from "@react-pdf/renderer";
import {
  TechnicalFilePdf,
  type TechnicalFileData,
} from "./templates/technical-file";

/**
 * Dedicated entry for the assembled Annex VII technical file (Phase 3). Reuses
 * the shared PDF chrome; takes the gathered + localized data and renders one
 * multi-section document.
 */
export async function generateTechnicalFilePdf({
  data,
  messages,
  generatedAt,
}: {
  data: TechnicalFileData;
  messages: Record<string, string>;
  generatedAt: string;
}): Promise<Buffer> {
  return renderToBuffer(
    <TechnicalFilePdf
      data={data}
      messages={messages}
      generatedAt={generatedAt}
    />,
  );
}
