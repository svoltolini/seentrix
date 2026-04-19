import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { getPlanFromPriceId } from "@/lib/constants/plans";

// Use service-role key for webhook — bypasses RLS
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000).toISOString();
  }
  return null;
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  // Idempotency check — Stripe retries deliveries on any non-2xx (and
  // sometimes on timeouts even when we did process it). Without this guard
  // a flaky network blip turns into double-charges or double-emails.
  const { error: idempotencyError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (idempotencyError) {
    // Duplicate PK means we already processed this one — ack and move on.
    if (idempotencyError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Any other insert error: bail with 500 so Stripe retries and we don't
    // silently drop an event.
    return NextResponse.json(
      { error: "idempotency_store_failed" },
      { status: 500 },
    );
  }

  switch (event.type) {
    // ----- Checkout completed → activate subscription -----
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode !== "subscription") break;

      const orgId = session.metadata?.org_id;
      const subscriptionId = session.subscription as string;

      if (!orgId || !subscriptionId) break;

      // Get subscription details to determine plan
      const subscription =
        await getStripe().subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? getPlanFromPriceId(priceId) : "professional";

      await supabase
        .from("organizations")
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          billing_period_end: getPeriodEnd(subscription),
        })
        .eq("id", orgId);

      break;
    }

    // ----- Subscription updated → plan changes -----
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      if (!orgId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? getPlanFromPriceId(priceId) : "free";

      await supabase
        .from("organizations")
        .update({
          plan,
          billing_period_end: getPeriodEnd(subscription),
        })
        .eq("id", orgId);

      break;
    }

    // ----- Subscription deleted → downgrade to free -----
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      if (!orgId) break;

      await supabase
        .from("organizations")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          billing_period_end: null,
        })
        .eq("id", orgId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
