"use server";

import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "./client";
import {
  isPurchasable,
  canBuyAiBoost,
  getPlanFromPriceId,
  getPlanPriceId,
  getAiBoostPriceId,
  isAiBoostPriceId,
  resolveCurrency,
  type OrgPlan,
  type BillingCurrency,
} from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";

type BillingInterval = "monthly" | "annual";

/** Stripe stores currency lowercase; coerce to our union (default eur). */
function asCurrency(c: string | null | undefined): BillingCurrency {
  return c === "chf" || c === "gbp" ? c : "eur";
}

/** The non-add-on subscription item (the base plan). */
function baseItem(subscription: Stripe.Subscription): Stripe.SubscriptionItem | undefined {
  return (
    subscription.items.data.find((it) => !isAiBoostPriceId(it.price?.id)) ??
    subscription.items.data[0]
  );
}

function hasAiBoostItem(subscription: Stripe.Subscription): boolean {
  return subscription.items.data.some((it) => isAiBoostPriceId(it.price?.id));
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
  const item = baseItem(subscription);
  const ts =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function intervalFromSubscription(
  subscription: Stripe.Subscription,
): BillingInterval | null {
  const i = baseItem(subscription)?.price?.recurring?.interval;
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

  // Get or create Stripe customer
  let stripeCustomerId: string | null = null;
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, name, country")
    .eq("id", orgId)
    .single();
  const orgRecord = org as Record<string, unknown> | null;

  // Currency follows the company country: CH→CHF, GB→GBP, else EUR.
  const currency = resolveCurrency(orgRecord?.country as string | null);
  const priceId = getPlanPriceId(plan, interval, currency);

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

  // Existing subscription → swap the base price in place with proration,
  // keeping the subscription's locked currency.
  try {
    const subscription = await getStripe().subscriptions.retrieve(subId);
    const item = baseItem(subscription);
    if (!item) return { error: "noSubscription" };

    const currency = asCurrency(subscription.currency);
    const newPriceId = getPlanPriceId(plan, interval, currency);

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
        ai_boost: false,
      })
      .eq("id", orgId!);
    return { ok: true, plan: "free" };
  }

  const priceId = baseItem(subscription)?.price?.id;
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
      billing_currency: inactive ? null : asCurrency(subscription.currency),
      ai_boost: inactive ? false : hasAiBoostItem(subscription),
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
// AI Boost add-on — add/remove a second subscription line item that raises the
// Copilot allowance. The add-on price must match the subscription's interval
// and currency (Stripe requires all items share the interval).
// ---------------------------------------------------------------------------

export async function addAiBoost(): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, orgId, error } = await requireAdmin();
  if (error) return { error };

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, stripe_subscription_id")
    .eq("id", orgId!)
    .single();
  const rec = org as {
    plan: string | null;
    stripe_subscription_id: string | null;
  } | null;
  if (!canBuyAiBoost((rec?.plan ?? "free") as OrgPlan)) {
    return { error: "planRequired" };
  }
  const subId = rec?.stripe_subscription_id ?? null;
  if (!subId) return { error: "noSubscription" };

  try {
    const subscription = await getStripe().subscriptions.retrieve(subId);
    if (hasAiBoostItem(subscription)) return { ok: true }; // already on

    const interval = intervalFromSubscription(subscription) ?? "monthly";
    const currency = asCurrency(subscription.currency);
    const boostPrice = getAiBoostPriceId(interval, currency);

    await getStripe().subscriptions.update(subId, {
      items: [{ price: boostPrice, quantity: 1 }],
      proration_behavior: "create_prorations",
      metadata: { ...subscription.metadata, org_id: orgId! },
    });

    await supabase
      .from("organizations")
      .update({ ai_boost: true })
      .eq("id", orgId!);
    await logActivity({ action: "billing.aiboost_added", targetType: "billing" });
    return { ok: true };
  } catch (e) {
    console.error("[billing] addAiBoost failed:", e);
    return { error: "stripe" };
  }
}

export async function removeAiBoost(): Promise<{ ok?: boolean; error?: string }> {
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
    const subscription = await getStripe().subscriptions.retrieve(subId);
    const boostItem = subscription.items.data.find((it) =>
      isAiBoostPriceId(it.price?.id),
    );
    if (boostItem) {
      await getStripe().subscriptions.update(subId, {
        items: [{ id: boostItem.id, deleted: true }],
        proration_behavior: "create_prorations",
      });
    }
    await supabase
      .from("organizations")
      .update({ ai_boost: false })
      .eq("id", orgId!);
    await logActivity({
      action: "billing.aiboost_removed",
      targetType: "billing",
    });
    return { ok: true };
  } catch (e) {
    console.error("[billing] removeAiBoost failed:", e);
    return { error: "stripe" };
  }
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
  currency: BillingCurrency;
  aiBoost: boolean;
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
      // Prefer the currency locked on the subscription; fall back to the one
      // resolved from the company country (for orgs without a subscription yet).
      currency:
        ((r.billing_currency as string) ||
          resolveCurrency(r.country as string | null)) as BillingCurrency,
      aiBoost: !!r.ai_boost,
    },
  };
}
