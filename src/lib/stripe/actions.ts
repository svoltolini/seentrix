"use server";

import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "./client";
import {
  STRIPE_PRICE_IDS,
  isPurchasable,
  getPlanFromPriceId,
  type OrgPlan,
} from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";

type BillingInterval = "monthly" | "annual";

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

/**
 * Resolve the caller and require they be an admin of their org. Billing
 * mutations move money, so every change action is gated here server-side —
 * the UI hiding the buttons is convenience, not the security boundary.
 */
async function requireAdmin() {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return { supabase, user: null, orgId: null, error: "notAuthenticated" as const };
  }
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data as { role: string } | null)?.role ?? null;
  if (role !== "admin") {
    return { supabase, user, orgId, error: "notAdmin" as const };
  }
  return { supabase, user, orgId, error: undefined };
}

function periodEndFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  const ts =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function intervalFromSubscription(
  subscription: Stripe.Subscription,
): BillingInterval | null {
  const i = subscription.items.data[0]?.price?.recurring?.interval;
  if (i === "year") return "annual";
  if (i === "month") return "monthly";
  return null;
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Create Checkout Session (initial subscribe — free → paid)
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  plan: Exclude<OrgPlan, "free">,
  interval: BillingInterval,
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

  try {
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

    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl()}/app/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/app/settings/billing`,
      metadata: { org_id: orgId },
      subscription_data: { metadata: { org_id: orgId } },
    });

    await logActivity({
      action: "billing.checkout_created",
      targetType: "billing",
      metadata: { plan, interval },
    });

    return { url: session.url ?? undefined };
  } catch (e) {
    console.error("[billing] createCheckoutSession failed:", e);
    return { error: "stripe" };
  }
}

// ---------------------------------------------------------------------------
// Change plan (upgrade / downgrade / switch interval on an existing sub)
//
// For a free org (no active subscription) this transparently falls back to
// Checkout. For a paying org it edits the live subscription's price in place
// with proration, so the change is instant and no second card entry is needed.
// ---------------------------------------------------------------------------

export async function changePlan(
  plan: Exclude<OrgPlan, "free">,
  interval: BillingInterval,
): Promise<{ url?: string; ok?: boolean; error?: string }> {
  if (!isPurchasable(plan)) return { error: "invalidPlan" };

  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const newPriceId = STRIPE_PRICE_IDS[plan]?.[interval];
  if (!newPriceId) return { error: "invalidPlan" };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_subscription_id")
    .eq("id", orgId!)
    .single();
  const subId =
    (org as { stripe_subscription_id: string | null } | null)
      ?.stripe_subscription_id ?? null;

  // No active subscription → this is an initial purchase. Use Checkout so
  // Stripe collects a payment method.
  if (!subId) {
    return createCheckoutSession(plan, interval);
  }

  // Existing subscription → swap the price in place with proration.
  try {
    const subscription = await getStripe().subscriptions.retrieve(subId);
    const item = subscription.items.data[0];
    if (!item) return { error: "noSubscription" };

    if (item.price?.id === newPriceId && !subscription.cancel_at_period_end) {
      return { error: "samePlan" };
    }

    const updated = await getStripe().subscriptions.update(subId, {
      items: [{ id: item.id, price: newPriceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { ...subscription.metadata, org_id: orgId! },
    });

    // Optimistic write so the UI reflects the change immediately; the webhook
    // reconciles authoritatively right after.
    await supabase
      .from("organizations")
      .update({
        plan,
        billing_interval: interval,
        billing_cancel_at_period_end: false,
        billing_period_end: periodEndFromSubscription(updated),
      })
      .eq("id", orgId!);

    await logActivity({
      action: "billing.plan_changed",
      targetType: "billing",
      metadata: { plan, interval },
    });

    return { ok: true };
  } catch (e) {
    console.error("[billing] changePlan failed:", e);
    return { error: "stripe" };
  }
}

// ---------------------------------------------------------------------------
// Cancel (at period end) / Resume
// ---------------------------------------------------------------------------

export async function cancelSubscription(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_subscription_id")
    .eq("id", orgId!)
    .single();
  const subId =
    (org as { stripe_subscription_id: string | null } | null)
      ?.stripe_subscription_id ?? null;
  if (!subId) return { error: "noSubscription" };

  try {
    await getStripe().subscriptions.update(subId, {
      cancel_at_period_end: true,
    });

    await supabase
      .from("organizations")
      .update({ billing_cancel_at_period_end: true })
      .eq("id", orgId!);

    await logActivity({
      action: "billing.cancel_scheduled",
      targetType: "billing",
    });
    return { ok: true };
  } catch (e) {
    console.error("[billing] cancelSubscription failed:", e);
    return { error: "stripe" };
  }
}

export async function resumeSubscription(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_subscription_id")
    .eq("id", orgId!)
    .single();
  const subId =
    (org as { stripe_subscription_id: string | null } | null)
      ?.stripe_subscription_id ?? null;
  if (!subId) return { error: "noSubscription" };

  try {
    await getStripe().subscriptions.update(subId, {
      cancel_at_period_end: false,
    });

    await supabase
      .from("organizations")
      .update({ billing_cancel_at_period_end: false })
      .eq("id", orgId!);

    await logActivity({ action: "billing.resumed", targetType: "billing" });
    return { ok: true };
  } catch (e) {
    console.error("[billing] resumeSubscription failed:", e);
    return { error: "stripe" };
  }
}

// ---------------------------------------------------------------------------
// Resync from Stripe (self-heal when a webhook was missed)
// ---------------------------------------------------------------------------

export async function resyncSubscription(): Promise<{
  ok?: boolean;
  plan?: OrgPlan;
  error?: string;
}> {
  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", orgId!)
    .single();
  const record = org as {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null;
  const customerId = record?.stripe_customer_id ?? null;
  if (!customerId) return { error: "noSubscription" };

  // Find the live subscription: the stored one if present, else the customer's
  // most recent non-terminal subscription.
  let subscription: Stripe.Subscription | null = null;
  if (record?.stripe_subscription_id) {
    try {
      subscription = await getStripe().subscriptions.retrieve(
        record.stripe_subscription_id,
      );
    } catch {
      subscription = null;
    }
  }
  if (!subscription) {
    try {
      const list = await getStripe().subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      subscription =
        list.data.find((s) =>
          ["active", "trialing", "past_due"].includes(s.status),
        ) ?? null;
    } catch (e) {
      console.error("[billing] resyncSubscription list failed:", e);
      return { error: "stripe" };
    }
  }

  if (!subscription) {
    await supabase
      .from("organizations")
      .update({
        plan: "free",
        stripe_subscription_id: null,
        billing_period_end: null,
        billing_interval: null,
        billing_cancel_at_period_end: false,
      })
      .eq("id", orgId!);
    return { ok: true, plan: "free" };
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const mapped = priceId ? getPlanFromPriceId(priceId) : "free";
  const inactive = ["canceled", "unpaid", "incomplete_expired"].includes(
    subscription.status,
  );
  const plan: OrgPlan = inactive ? "free" : mapped;

  await supabase
    .from("organizations")
    .update({
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: inactive ? null : subscription.id,
      billing_period_end: inactive
        ? null
        : periodEndFromSubscription(subscription),
      billing_interval: inactive ? null : intervalFromSubscription(subscription),
      billing_cancel_at_period_end: inactive
        ? false
        : (subscription.cancel_at_period_end ?? false),
    })
    .eq("id", orgId!);

  await logActivity({
    action: "billing.resynced",
    targetType: "billing",
    metadata: { plan },
  });
  return { ok: true, plan };
}

// ---------------------------------------------------------------------------
// Create Customer Portal Session (invoices, receipts, payment methods)
// ---------------------------------------------------------------------------

export async function createPortalSession(): Promise<{
  url?: string;
  error?: string;
}> {
  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId!)
    .single();
  const stripeCustomerId =
    (org as { stripe_customer_id: string | null } | null)?.stripe_customer_id ??
    null;
  if (!stripeCustomerId) return { error: "noSubscription" };

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl()}/app/settings/billing`,
    });
    return { url: session.url };
  } catch (e) {
    console.error("[billing] createPortalSession failed:", e);
    return { error: "stripe" };
  }
}

// ---------------------------------------------------------------------------
// Get billing info for current org
// ---------------------------------------------------------------------------

export interface BillingInfo {
  plan: OrgPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingPeriodEnd: string | null;
  billingInterval: BillingInterval | null;
  cancelAtPeriodEnd: boolean;
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

  const r = org as Record<string, unknown>;
  return {
    billing: {
      plan: ((r.plan as string) || "free") as OrgPlan,
      stripeCustomerId: (r.stripe_customer_id as string) || null,
      stripeSubscriptionId: (r.stripe_subscription_id as string) || null,
      billingPeriodEnd: (r.billing_period_end as string) || null,
      billingInterval: ((r.billing_interval as string) || null) as
        | BillingInterval
        | null,
      cancelAtPeriodEnd: !!r.billing_cancel_at_period_end,
    },
  };
}
