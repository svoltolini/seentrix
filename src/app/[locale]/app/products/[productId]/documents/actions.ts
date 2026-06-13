"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { canWrite, canIssueDoC } from "@/lib/constants/roles";
import { logActivity } from "@/lib/activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType =
  | "declaration_of_conformity"
  | "vulnerability_disclosure_policy"
  | "incident_report"
  | "risk_assessment"
  | "technical_documentation"
  | "authorised_representative_mandate";

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
  released_at: string | null;
  retention_until: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { supabase, user: null, orgId: null, role: null };

  const orgId = user.app_metadata?.org_id as string | undefined;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data as { role: string } | null)?.role ?? null;
  return { supabase, user, orgId: orgId ?? null, role };
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
      "id, product_id, document_type, title, content, status, version, file_url, generated_at, released_at, retention_until, created_at, updated_at"
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
      "id, product_id, document_type, title, content, status, version, file_url, generated_at, released_at, retention_until, created_at, updated_at"
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
  const { supabase, user, role } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

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
  const { supabase, user, role } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const patch: Record<string, unknown> = { status };

  // Retention stamping (Art 13(13)): when a Declaration of Conformity is
  // marked final, stamp its release date + the retention deadline (10 years,
  // or the support-period end if later). Idempotent — the first release date
  // is preserved on re-finalization.
  if (status === "final") {
    const { data: doc } = await supabase
      .from("documents")
      .select("document_type, product_id, released_at")
      .eq("id", documentId)
      .single();
    const d = doc as {
      document_type: string;
      product_id: string;
      released_at: string | null;
    } | null;
    if (d?.document_type === "declaration_of_conformity") {
      // Issuing (finalizing) the DoC is restricted to admin / compliance
      // officer — editors may draft it but not sign it off (matches the
      // conformity tab and the segregation-of-duties role guide).
      if (!canIssueDoC(role)) return { error: "notAuthorized" };
      const { data: product } = await supabase
        .from("products")
        .select("support_period_end")
        .eq("id", d.product_id)
        .single();
      const supportEnd = (product as { support_period_end: string | null } | null)
        ?.support_period_end;
      const { retentionUntil } = await import("@/lib/constants/annex-vii");
      const releasedAt = d.released_at ? new Date(d.released_at) : new Date();
      const retention = retentionUntil(
        releasedAt,
        supportEnd ? new Date(supportEnd) : null,
      );
      patch.released_at = d.released_at ?? releasedAt.toISOString();
      patch.retention_until = retention.toISOString();
    }
  }

  const { error } = await supabase
    .from("documents")
    .update(patch)
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
  const { supabase, user, orgId, role } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };
  if (!orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

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

  // 2. Generate PDF buffer in the user's UI language. Per the CRA, the
  // customer-facing compliance documents (DoC, user instructions) should be in
  // the language of the market where the product is sold; we default that to
  // the user's chosen UI locale (resolved from the NEXT_LOCALE cookie).
  const { getLocale } = await import("next-intl/server");
  const { isLocale } = await import("@/i18n/locales");
  const resolved = await getLocale();
  const docLocale = isLocale(resolved) ? resolved : "en";
  const { generatePdfBuffer } = await import("@/lib/pdf/generate");
  const buffer = await generatePdfBuffer({
    documentType: doc.document_type as DocumentType,
    content: doc.content,
    locale: docLocale,
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
