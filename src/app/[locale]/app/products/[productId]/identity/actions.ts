"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { isCeLocation, type CeLocation } from "./constants";

export interface IdentityState {
  productName: string;
  canWrite: boolean;
  identity: {
    model_number: string;
    batch_number: string;
    serial_number: string;
    known_risks: string;
    notified_body_certificate: string;
  };
  ce: {
    ce_affixed_at: string | null;
    ce_locations: CeLocation[];
    ce_notes: string;
  };
  publicDocEnabled: boolean;
  declarationVersion: string | null;
  supportPeriodEnd: string | null;
  /** Manufacturer block, from the org — display-only on this screen. */
  manufacturer: {
    name: string;
    address: string;
    contact: string;
    website: string;
  };
  /** Public-DoC URL prerequisites. */
  orgSlug: string | null;
  orgPublicEnabled: boolean;
}

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null, role: null };
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? null;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data as { role: string } | null)?.role ?? null;
  return { supabase, user, orgId, role };
}

const ROLES_CAN_WRITE = new Set(["admin", "compliance_officer", "cto", "editor"]);
function canWrite(r: string | null) {
  return !!r && ROLES_CAN_WRITE.has(r);
}

export async function loadIdentity(
  productId: string,
): Promise<{ state: IdentityState | null; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const [{ data: product }, { data: org }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "name, model_number, batch_number, serial_number, known_risks, notified_body_certificate, ce_affixed_at, ce_locations, ce_notes, public_doc_enabled, declaration_version, support_period_end",
      )
      .eq("id", productId)
      .single(),
    supabase
      .from("organizations")
      .select(
        "legal_name, name, address_line1, address_line2, postal_code, city, country, contact_email, security_contact_email, website, slug, security_public_enabled",
      )
      .eq("id", orgId)
      .maybeSingle(),
  ]);
  if (!product) return { state: null, error: "notFound" };

  const p = product as Record<string, unknown>;
  const o = (org as Record<string, string | boolean | null>) ?? {};
  const address = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    state: {
      productName: (p.name as string) ?? "",
      canWrite: canWrite(role),
      identity: {
        model_number: (p.model_number as string) ?? "",
        batch_number: (p.batch_number as string) ?? "",
        serial_number: (p.serial_number as string) ?? "",
        known_risks: (p.known_risks as string) ?? "",
        notified_body_certificate: (p.notified_body_certificate as string) ?? "",
      },
      ce: {
        ce_affixed_at: (p.ce_affixed_at as string | null) ?? null,
        ce_locations: ((p.ce_locations as string[] | null) ?? []).filter(
          isCeLocation,
        ),
        ce_notes: (p.ce_notes as string) ?? "",
      },
      publicDocEnabled: !!p.public_doc_enabled,
      declarationVersion: (p.declaration_version as string | null) ?? null,
      supportPeriodEnd: (p.support_period_end as string | null) ?? null,
      manufacturer: {
        name: (o.legal_name as string) || (o.name as string) || "",
        address,
        contact:
          (o.contact_email as string) ||
          (o.security_contact_email as string) ||
          "",
        website: (o.website as string) || "",
      },
      orgSlug: (o.slug as string | null) ?? null,
      orgPublicEnabled: !!o.security_public_enabled,
    },
  };
}

export interface IdentityInput {
  model_number: string;
  batch_number: string;
  serial_number: string;
  known_risks: string;
  notified_body_certificate: string;
  ce_affixed_at: string | null;
  ce_locations: string[];
  ce_notes: string;
}

export async function saveIdentity(
  productId: string,
  input: IdentityInput,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("products")
    .update({
      model_number: input.model_number || null,
      batch_number: input.batch_number || null,
      serial_number: input.serial_number || null,
      known_risks: input.known_risks || null,
      notified_body_certificate: input.notified_body_certificate || null,
      ce_affixed_at: input.ce_affixed_at || null,
      ce_locations: input.ce_locations.filter(isCeLocation),
      ce_notes: input.ce_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "product.identity_updated",
    targetType: "product",
    targetId: productId,
  });
  revalidatePath(`/app/products/${productId}/identity`);
  return {};
}

export async function setPublicDoc(
  productId: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("products")
    .update({ public_doc_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: "generic" };

  await logActivity({
    action: enabled ? "product.doc_published" : "product.doc_unpublished",
    targetType: "product",
    targetId: productId,
  });
  revalidatePath(`/app/products/${productId}/identity`);
  return {};
}
