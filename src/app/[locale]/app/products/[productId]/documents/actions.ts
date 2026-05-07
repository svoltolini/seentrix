"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType =
  | "declaration_of_conformity"
  | "vulnerability_disclosure_policy"
  | "incident_report"
  | "risk_assessment"
  | "technical_documentation";

export type DocumentStatus = "not_started" | "draft" | "final";

export interface DocumentRecord {
  id: string;
  product_id: string;
  document_type: DocumentType;
  title: string;
  content: string | null;
  status: DocumentStatus;
  version: number;
  file_url: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, orgId: null };

  const orgId = user.app_metadata?.org_id as string | undefined;
  return { supabase, user, orgId: orgId ?? null };
}

// ---------------------------------------------------------------------------
// List documents for a product (one per type)
// ---------------------------------------------------------------------------

export async function listDocuments(
  productId: string
): Promise<{ documents: DocumentRecord[]; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { documents: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, product_id, document_type, title, content, status, version, file_url, generated_at, created_at, updated_at"
    )
    .eq("product_id", productId)
    .order("document_type", { ascending: true });

  if (error) return { documents: [], error: "generic" };

  return { documents: (data ?? []) as DocumentRecord[] };
}

// ---------------------------------------------------------------------------
// Get a single document
// ---------------------------------------------------------------------------

export async function getDocument(
  documentId: string
): Promise<{ document: DocumentRecord | null; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { document: null, error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, product_id, document_type, title, content, status, version, file_url, generated_at, created_at, updated_at"
    )
    .eq("id", documentId)
    .single();

  if (error) return { document: null, error: "generic" };

  return { document: data as DocumentRecord };
}

// ---------------------------------------------------------------------------
// Save (upsert) a document
// ---------------------------------------------------------------------------

export async function saveDocument(
  productId: string,
  documentType: DocumentType,
  title: string,
  content: string,
  status: DocumentStatus = "draft"
): Promise<{ documentId?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  // Check if document already exists for this product+type
  const { data: existing } = await supabase
    .from("documents")
    .select("id, version")
    .eq("product_id", productId)
    .eq("document_type", documentType)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("documents")
      .update({
        title,
        content,
        status,
        version: existing.version + 1,
        regulation: "cra",
      })
      .eq("id", existing.id);

    if (error) return { error: "saveFailed" };
    await logActivity({ action: "document.saved", targetType: "document", targetId: existing.id, targetName: title, metadata: { documentType, productId } });
    return { documentId: existing.id };
  }

  // Insert new
  const { data, error } = await supabase
    .from("documents")
    .insert({
      product_id: productId,
      document_type: documentType,
      title,
      content,
      status,
      regulation: "cra",
    })
    .select("id")
    .single();

  if (error || !data) return { error: "saveFailed" };
  await logActivity({ action: "document.saved", targetType: "document", targetId: data.id, targetName: title, metadata: { documentType, productId } });
  return { documentId: data.id };
}

// ---------------------------------------------------------------------------
// Update document status
// ---------------------------------------------------------------------------

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("documents")
    .update({ status })
    .eq("id", documentId);

  if (error) return { error: "generic" };
  await logActivity({ action: "document.status_changed", targetType: "document", targetId: documentId, metadata: { status } });
  return {};
}

// ---------------------------------------------------------------------------
// Generate PDF + upload to Supabase Storage
// ---------------------------------------------------------------------------

export async function generateDocumentPdf(
  documentId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };
  if (!orgId) return { error: "notAuthenticated" };

  // Check plan allows PDF generation
  const { canGeneratePdf } = await import("@/lib/constants/plans");
  const { data: orgData } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();
  const orgPlan = ((orgData as Record<string, unknown> | null)?.plan as string) || "free";
  if (!canGeneratePdf(orgPlan as "free" | "professional" | "business" | "enterprise")) {
    return { error: "planRequired" };
  }

  // 1. Load document
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select(
      "id, product_id, document_type, content, file_url"
    )
    .eq("id", documentId)
    .single();

  if (fetchError || !doc) return { error: "documentNotFound" };
  if (!doc.content) return { error: "noContent" };

  // 2. Generate PDF buffer
  const { generatePdfBuffer } = await import("@/lib/pdf/generate");
  const buffer = await generatePdfBuffer({
    documentType: doc.document_type as DocumentType,
    content: doc.content,
    locale: "en",
  });

  // 3. Delete old PDF if exists
  if (doc.file_url) {
    await supabase.storage.from("document-pdfs").remove([doc.file_url]);
  }

  // 4. Upload new PDF
  const timestamp = Date.now();
  const storagePath = `${orgId}/${doc.product_id}/${doc.document_type}_${timestamp}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("document-pdfs")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) return { error: "uploadFailed" };

  // 5. Update document row
  await supabase
    .from("documents")
    .update({
      file_url: storagePath,
      generated_at: new Date().toISOString(),
    })
    .eq("id", doc.id);

  // 6. Create signed URL (1 hour)
  const { data: signedData, error: signError } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(storagePath, 3600);

  if (signError || !signedData?.signedUrl) return { error: "uploadFailed" };

  await logActivity({ action: "document.pdf_generated", targetType: "document", targetId: documentId, metadata: { documentType: doc.document_type } });

  return { url: signedData.signedUrl };
}

// ---------------------------------------------------------------------------
// Download existing PDF (create fresh signed URL)
// ---------------------------------------------------------------------------

export async function downloadDocumentPdf(
  documentId: string
): Promise<{ url?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", documentId)
    .single();

  if (fetchError || !doc) return { error: "documentNotFound" };
  if (!doc.file_url) return { error: "noPdf" };

  const { data: signedData, error: signError } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(doc.file_url, 3600);

  if (signError || !signedData?.signedUrl) return { error: "noPdf" };

  return { url: signedData.signedUrl };
}
