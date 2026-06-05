"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "./client";
import { STRIPE_PRICE_IDS, isPurchasable, type OrgPlan } from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";

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
// Create Checkout Session
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  plan: Exclude<OrgPlan, "free">,
  interval: "monthly" | "annual"
): Promise<{ url?: string; error?: string }> {
  // Defense in depth: only purchasable tiers can ever reach Stripe, even if a
  // caller bypasses the UI. Non-purchasable plans (e.g. Enterprise "coming
  // soon") are rejected before any customer/session is created.
  if (!isPurchasable(plan)) return { error: "invalidPlan" };

  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const priceId = STRIPE_PRICE_IDS[plan]?.[interval];
  if (!priceId) return { error: "invalidPlan" };

  // Get or create Stripe customer
  let stripeCustomerId: string | null = null;

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, name")
    .eq("id", orgId)
    .single();

  const orgRecord = org as Record<string, unknown> | null;

  if (orgRecord?.stripe_customer_id) {
    stripeCustomerId = orgRecord.stripe_customer_id as string;
  } else {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { org_id: orgId, user_id: user.id },
      name: (orgRecord?.name as string) || undefined,
    });
    stripeCustomerId = customer.id;

    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customer.id })
      .eq("id", orgId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { org_id: orgId },
    subscription_data: {
      metadata: { org_id: orgId },
    },
  });

  await logActivity({ action: "billing.checkout_created", targetType: "billing", metadata: { plan, interval } });

  return { url: session.url ?? undefined };
}

// ---------------------------------------------------------------------------
// Create Customer Portal Session
// ---------------------------------------------------------------------------

export async function createPortalSession(): Promise<{
  url?: string;
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .single();

  const orgRecord = org as Record<string, unknown> | null;
  const stripeCustomerId = orgRecord?.stripe_customer_id as string | null;

  if (!stripeCustomerId) return { error: "noSubscription" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/app/settings/billing`,
  });

  return { url: session.url };
}

// ---------------------------------------------------------------------------
// Get billing info for current org
// ---------------------------------------------------------------------------

export interface BillingInfo {
  plan: OrgPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingPeriodEnd: string | null;
}

export async function getBillingInfo(): Promise<{
  billing: BillingInfo | null;
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { billing: null, error: "notAuthenticated" };

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error || !org) return { billing: null, error: "generic" };

  const orgRecord = org as Record<string, unknown>;

  return {
    billing: {
      plan: ((orgRecord.plan as string) || "free") as OrgPlan,
      stripeCustomerId: (orgRecord.stripe_customer_id as string) || null,
      stripeSubscriptionId:
        (orgRecord.stripe_subscription_id as string) || null,
      billingPeriodEnd: (orgRecord.billing_period_end as string) || null,
    },
  };
}
