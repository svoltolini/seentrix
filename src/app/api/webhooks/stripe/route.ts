import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import {
  getPlanFromPriceId,
  isAiBoostPriceId,
  SUPPORTED_CURRENCIES,
  type BillingCurrency,
  type OrgPlan,
} from "@/lib/constants/plans";

// Use service-role key for webhook — bypasses RLS
function getAdminSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Subscription → organization sync
//
// All subscription state flows through one idempotent helper so checkout,
// created, and updated events can't drift apart. We read the *current* state
// of the subscription and write it onto the org; running it twice is a no-op.
// ---------------------------------------------------------------------------

/**
 * The "base" plan line item — the one whose price is NOT the AI Boost add-on.
 * A subscription can carry two items (plan + AI Boost); plan/period/interval
 * must always be read from the plan item, never the add-on.
 */
function baseItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  const items = subscription.items.data;
  return items.find((i) => !isAiBoostPriceId(i.price?.id)) ?? items[0];
}

/** True if the subscription carries an active AI Boost add-on line item. */
function hasAiBoostItem(subscription: Stripe.Subscription): boolean {
  return subscription.items.data.some((i) => isAiBoostPriceId(i.price?.id));
}

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  // Stripe moved current_period_end onto the subscription item (flexible
  // billing). Read it from the base item; fall back to the legacy top-level
  // field if a future/older shape ever surfaces.
  const item = baseItem(subscription);
  const ts =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function getInterval(subscription: Stripe.Subscription): "monthly" | "annual" | null {
  const interval = baseItem(subscription)?.price?.recurring?.interval;
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  return null;
}

/** Coerce Stripe's lowercase currency string to a supported billing currency. */
function getBillingCurrency(
  subscription: Stripe.Subscription,
): BillingCurrency | null {
  const c = (subscription.currency ?? "").toLowerCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c)
    ? (c as BillingCurrency)
    : null;
}

// Subscription statuses where the org should NOT have a paid plan.
const INACTIVE_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "canceled",
  "unpaid",
  "incomplete_expired",
]);

/**
 * Resolve the org id for a subscription: prefer the metadata we stamp at
 * checkout, fall back to a customer-id lookup so an event that lost its
 * metadata still reconciles.
 */
async function resolveOrgId(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromMeta = subscription.metadata?.org_id;
  if (fromMeta) return fromMeta;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return null;

  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Write a subscription's current state onto its org. Returns an error string
 * on DB failure so the caller can 500 and let Stripe retry. Never silently
 * downgrades a paying customer to "free": if the price doesn't map to a known
 * plan (e.g. a price-id env var is missing) we leave `plan` untouched rather
 * than guess.
 */
async function syncSubscriptionToOrg(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<{ error?: string; skipped?: boolean }> {
  const orgId = await resolveOrgId(supabase, subscription);
  if (!orgId) return { skipped: true };

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer?.id ?? null);
  const priceId = baseItem(subscription)?.price?.id;
  const active = !INACTIVE_STATUSES.has(subscription.status);

  const update: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    billing_period_end: getPeriodEnd(subscription),
    billing_interval: getInterval(subscription),
    billing_currency: getBillingCurrency(subscription),
    billing_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    // The AI Boost add-on only counts while the subscription is live.
    ai_boost: active && hasAiBoostItem(subscription),
  };

  if (!active) {
    // Terminal/unpaid state surfacing as an update — drop to free.
    update.plan = "free";
    update.billing_cancel_at_period_end = false;
  } else {
    const mapped: OrgPlan | null = priceId ? getPlanFromPriceId(priceId) : null;
    // getPlanFromPriceId returns "free" for an unmapped/blank price id. An
    // active subscription should never resolve to free that way — that's a
    // misconfiguration, not a downgrade, so leave the existing plan in place.
    if (mapped && mapped !== "free") update.plan = mapped;
  }

  const { error } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", orgId);
  if (error) return { error: error.message };
  return {};
}

async function downgradeToFree(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<{ error?: string; skipped?: boolean }> {
  const orgId = await resolveOrgId(supabase, subscription);
  if (!orgId) return { skipped: true };

  const { error } = await supabase
    .from("organizations")
    .update({
      plan: "free",
      stripe_subscription_id: null,
      billing_period_end: null,
      billing_interval: null,
      billing_cancel_at_period_end: false,
      ai_boost: false,
    })
    .eq("id", orgId);
  if (error) return { error: error.message };
  return {};
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  // Idempotency — Stripe retries on any non-2xx (and sometimes on timeouts
  // even when we did process it). Record the event id first so a duplicate
  // delivery is acked without reprocessing.
  const { error: idempotencyError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (idempotencyError) {
    if (idempotencyError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // The idempotency ledger itself is unreachable (e.g. table missing). Bail
    // with 500 so Stripe retries and we don't silently drop the event.
    return NextResponse.json(
      { error: "idempotency_store_failed" },
      { status: 500 },
    );
  }

  // Process the event. On any handler failure we remove the idempotency row so
  // Stripe's retry actually reprocesses (rather than being acked as a dup).
  let result: { error?: string; skipped?: boolean } = {};
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const subscriptionId = session.subscription as string | null;
        if (!subscriptionId) break;
        const subscription =
          await getStripe().subscriptions.retrieve(subscriptionId);
        // Carry the checkout's org_id onto the subscription object in case the
        // subscription itself wasn't stamped (defensive).
        if (!subscription.metadata?.org_id && session.metadata?.org_id) {
          subscription.metadata = {
            ...subscription.metadata,
            org_id: session.metadata.org_id,
          };
        }
        result = await syncSubscriptionToOrg(supabase, subscription);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        result = await syncSubscriptionToOrg(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        result = await downgradeToFree(supabase, subscription);
        break;
      }
    }
  } catch (err) {
    result = { error: err instanceof Error ? err.message : "handler_error" };
  }

  if (result.error) {
    // Roll back the idempotency record so the retry reprocesses this event.
    await supabase.from("stripe_events").delete().eq("event_id", event.id);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
