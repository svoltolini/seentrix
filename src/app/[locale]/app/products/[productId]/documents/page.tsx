import { listDocuments } from "./actions";
import { DocumentsContent } from "./documents-content";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { documents } = await listDocuments(productId);

  return <DocumentsContent productId={productId} initialDocuments={documents} />;
}
