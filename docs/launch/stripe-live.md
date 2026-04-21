# Stripe — live-mode setup (2026-04-20)

Seentrix Ltd is now wired to process real payments via Stripe. This
note is the single record of what got configured, so if anything ever
needs to be reverted or reproduced we're not re-deriving it from
memory.

## Products + prices

Three products, six prices. All in **EUR**, all billed via Stripe
Checkout → Stripe Subscription. Annual plans priced as "2 months
free" (10 × monthly).

| Product | Stripe product id | Monthly price id | Annual price id |
|---|---|---|---|
| Professional (€59 / €590) | `prod_UNUNFPzxwlmP8L` | `price_1TOjOUERTTk1fRmMwLq2vICp` | `price_1TOjOUERTTk1fRmMzWcEc47Z` |
| Business (€199 / €1,990) | `prod_UNUNI62yM7jhiX` | `price_1TOjOVERTTk1fRmMr2Ia5IX1` | `price_1TOjOVERTTk1fRmMUNlsFDUj` |
| Enterprise (€749 / €7,490) | `prod_UNUNzDfohnZLdp` | `price_1TOjOWERTTk1fRmMnRAMieiz` | `price_1TOjOWERTTk1fRmMixRyyHZ2` |

Each price's id is the canonical mapping the app uses — changing a
price in Stripe requires coordinating the env-var update below.

## Vercel env vars (production + preview)

- `STRIPE_SECRET_KEY` — live secret (sk_live_…)
- `STRIPE_WEBHOOK_SECRET` — `whsec_…` (per webhook endpoint below)
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` → `price_1TOjOUERTTk1fRmMwLq2vICp`
- `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL`  → `price_1TOjOUERTTk1fRmMzWcEc47Z`
- `NEXT_PUBLIC_STRIPE_PRICE_BIZ_MONTHLY` → `price_1TOjOVERTTk1fRmMr2Ia5IX1`
- `NEXT_PUBLIC_STRIPE_PRICE_BIZ_ANNUAL`  → `price_1TOjOVERTTk1fRmMUNlsFDUj`
- `NEXT_PUBLIC_STRIPE_PRICE_ENT_MONTHLY` → `price_1TOjOWERTTk1fRmMnRAMieiz`
- `NEXT_PUBLIC_STRIPE_PRICE_ENT_ANNUAL`  → `price_1TOjOWERTTk1fRmMixRyyHZ2`

Env vars take effect on the **next** deploy; the commit adding this
doc triggers that deploy.

## Webhook endpoint

- URL: `https://seentrix.com/api/webhooks/stripe`
- Stripe id: `we_1TOjQHERTTk1fRmM0Qssnc7q`
- Signing secret: stored in Vercel as `STRIPE_WEBHOOK_SECRET`
- Enabled events:
  - `checkout.session.completed` — activate subscription, write
    `stripe_customer_id` + `stripe_subscription_id` on the org row
  - `customer.subscription.updated` — plan changes, renewals
  - `customer.subscription.deleted` — downgrade back to Free
- Idempotency: every delivery inserts into `public.stripe_events`;
  duplicate event ids are ack'd as `{received: true, duplicate: true}`
  so Stripe retries don't double-charge.

## Payment-method configuration

Default configuration `pmc_1TOIX2ERTTk1fRmMGec3CwY2`. Methods enabled
for checkout (Stripe filters at render time by country + subscription
mode):

- **Card** (incl. Apple Pay / Google Pay) — always on
- **SEPA Direct Debit** — critical for DACH B2B recurring
- **Revolut Pay** — lower fees + faster settlement than card
- **Bancontact** — Belgium
- **iDeal** — Netherlands (first-charge then SEPA for renewals)
- Plus the Stripe defaults (Klarna, Link, etc.) — Stripe auto-filters
  methods that don't support subscription mode

## Customer portal

Configuration `bpc_1TOjRhERTTk1fRmMc7ADD5pq` (default + active):

- Cancel at period end, with a structured cancellation-reason survey
- Plan switching across all six price IDs above — proration enabled
- Invoice history
- Payment-method update
- Profile update (email, name, address, phone, tax id)
- Return URL: `https://seentrix.com/en/app/settings/billing`
- Branding links: Privacy `/legal/privacy`, Terms `/legal/terms`

## Post-setup checklist

- [ ] Archive the old **test-mode** products / prices / webhook in the
      Stripe dashboard (they're decoupled from the app now but worth
      removing so you don't accidentally use them in test).
- [ ] Verify VAT / invoice numbering settings in Stripe → Settings →
      Business settings → Customer emails + invoices match the UK
      Ltd details (Seentrix Ltd · Companies House 17169165).
- [ ] Rotate the live secret key once and update Vercel — the key
      that was used to set this up was pasted in a chat log.
- [ ] Run a £0.01 test purchase in an incognito window to confirm
      the end-to-end flow (checkout → webhook → plan flip → portal).

## Reverse-order teardown (if ever needed)

1. Disable the webhook endpoint in Stripe (don't delete — history is
   useful).
2. Archive products in Stripe (hides them from new checkouts; existing
   subscriptions keep billing).
3. Delete the six `NEXT_PUBLIC_STRIPE_PRICE_*` env vars in Vercel.
4. `STRIPE_SECRET_KEY` can stay — it's pinned to the account, not a
   config choice.
