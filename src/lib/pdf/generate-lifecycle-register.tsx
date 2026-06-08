import { renderToBuffer } from "@react-pdf/renderer";
import {
  LifecycleRegisterPdf,
  type LifecycleRegisterData,
} from "./templates/lifecycle-register";

/** Dedicated entry for the Phase-6 lifecycle & supply-chain register PDF. */
export async function generateLifecycleRegisterPdf({
  data,
  messages,
  generatedAt,
}: {
  data: LifecycleRegisterData;
  messages: Record<string, string>;
  generatedAt: string;
}): Promise<Buffer> {
  return renderToBuffer(
    <LifecycleRegisterPdf
      data={data}
      messages={messages}
      generatedAt={generatedAt}
    />,
  );
}
