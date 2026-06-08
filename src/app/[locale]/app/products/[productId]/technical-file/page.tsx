import { notFound } from "next/navigation";
import { loadTechnicalFile } from "./actions";
import { TechnicalFileContent } from "./technical-file-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

export default async function TechnicalFilePage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { state } = await loadTechnicalFile(productId);
  if (!state) notFound();

  return (
    <>
      <ScreenTrainingBanner screenKey="technical-file" />
      <TechnicalFileContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Technical File" };
