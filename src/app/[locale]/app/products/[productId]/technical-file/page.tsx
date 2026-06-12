import { notFound } from "next/navigation";
import { loadTechnicalFile } from "./actions";
import { TechnicalFileContent } from "./technical-file-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

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
      <LearnScreenContext screenKey="technical-file" />
      <TechnicalFileContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Technical File" };
