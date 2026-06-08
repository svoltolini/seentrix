import { notFound } from "next/navigation";
import { getCurrentUserRole } from "../../../settings/actions";
import { loadDiagramsAndEvidence } from "./actions";
import { DiagramsContent } from "./diagrams-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);

export default async function DiagramsPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const [{ state }, role] = await Promise.all([
    loadDiagramsAndEvidence(productId),
    getCurrentUserRole(),
  ]);

  if (!state) notFound();

  return (
    <>
      <ScreenTrainingBanner screenKey="diagrams" />
      <DiagramsContent
        productId={productId}
        initial={state}
        canWrite={!!role && ROLES_CAN_WRITE.has(role)}
      />
    </>
  );
}

export const metadata = { title: "Diagrams & Evidence" };
