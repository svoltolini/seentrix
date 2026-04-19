# UK incorporation checklist for Seentrix

End-to-end flow for setting Seentrix up as a UK private company limited
by shares ("Ltd") and connecting it to everything Seentrix already
runs on: Vercel, Supabase, Stripe, Resend, Sentry.

This is a practical checklist, not legal advice. The legal pages
(`src/app/[locale]/legal/*`) still need a lawyer pass on top of this —
this doc only handles the company plumbing.

---

## Decisions to lock before you file

| Item | Guidance |
|---|---|
| Registered company name | `Seentrix Ltd` keeps the trading name intact. Must be available at [find-and-update.company-information.service.gov.uk](https://find-and-update.company-information.service.gov.uk/). |
| Directors | One is enough (you). Add a second only when there's a co-founder. |
| Shareholders | Same as directors for a solo founder. |
| Share structure | 100 ordinary shares at £0.01 each is the default hack — gives you room to issue more without a share split later. |
| SIC codes | `62012` (Business and domestic software development) + `63110` (Data processing, hosting and related activities). Put both on the filing. |
| Registered office | Your home address is fine, but it's published publicly. A registered-office service (~£30–50/year) keeps your home address off Companies House. See [Service address providers](#service-addresses) below. |
| Fiscal year end | Default is the last day of the month one year after incorporation. Moving it to 31 March or 31 December later is a 5-min form. |

---

## Step 1 — Register the company (20 min, £12)

1. [companieshouse.gov.uk → Register a company](https://www.gov.uk/limited-company-formation)
2. Fill in the form:
   - Name: `Seentrix Ltd`
   - Registered office: your chosen address
   - Directors: you
   - Shareholders + share capital: you, 100 ordinary @ £0.01 (£1 total)
   - SIC codes: `62012`, `63110`
   - Articles of association: **Model articles** (standard, free). Only deviate if a lawyer says so.
3. Pay £12.
4. Certificate of incorporation arrives by email within 24 hours (often same-day).

You'll receive:
- **Company number** — 8 digits, e.g. `12345678`. Needed in legal pages.
- **Date of incorporation**
- **Authentication code** — keep this; you'll need it for annual filings.

### Service addresses

If you don't want your home address public:

| Provider | Price | Notes |
|---|---|---|
| Hoxton Mix | ~£25/month | Central London address, mail scanning |
| Your Virtual Office London | ~£30/year (registered office only) | Cheapest option, no mail handling |
| Mail Boxes Etc | Variable | Many locations |

Registered office = where government mail goes (HMRC, Companies House).
Service address = where director's personal mail goes. Can be the same.

---

## Step 2 — Open a UK business bank account (1–3 days)

Fastest options, in order of simplicity:

1. **[Wise Business](https://wise.com/gb/business/)** — instant account, holds GBP + EUR + USD in one. Good for a SaaS collecting Stripe payouts in multiple currencies. £45 one-time fee, no monthly.
2. **[Revolut Business](https://www.revolut.com/business/)** — similar to Wise, also instant.
3. **[Starling Business](https://www.starlingbank.com/business-account/)** — proper UK bank with full sort code / BIC, FSCS-protected. 2–3 day approval.
4. **Mercury** — US-based but accepts UK Ltds. Good if you want USD-first.

**For Seentrix specifically**, Wise Business is the pragmatic default:
- Holds EUR, so you don't pay FX when your EU customers pay in euros and Stripe pays out in EUR
- Direct debit for Stripe payouts
- Free EUR IBAN (can present that to EU customers for invoices)

Once the account exists:
- Note the **sort code + account number** (GBP)
- Note the **IBAN** (EUR, if using Wise)
- Put both in Stripe's payout settings

---

## Step 3 — Register with HMRC (within 3 months)

UK Ltds are automatically registered for Corporation Tax when incorporated.
You'll get a **UTR (Unique Taxpayer Reference)** by post to the registered
office within 14 days. Keep this letter — needed for tax filings.

**VAT** — you only need to register when **one** of these is true:
- You expect UK taxable turnover to exceed £90,000 in any 12-month period
- You sell to UK consumers (B2C) and expect to exceed the threshold
- You sell digital services to EU B2C customers and cross €10,000/year (→ OSS registration)

For B2B SaaS charging business customers, UK VAT reverse-charges for EU
business customers automatically. Voluntary registration gets you VAT on
receipts (reclaimable) but adds quarterly filings. **Skip for year one**
unless you see real volume.

---

## Step 4 — ICO registration (£52/year)

Mandatory for every UK company processing personal data — which is you,
because you collect email addresses on the landing page alone.

1. [ico.org.uk → Data protection fee](https://ico.org.uk/for-organisations/data-protection-fee/)
2. Tier 1 (£52/year) — applies to orgs with turnover <£632k AND <10 staff
3. Pay online, done. You get a registration number.

**Put the registration number in your privacy policy** — I'll do this
substitution when you have it.

---

## Step 5 — EU Article 27 Representative (~€500–1,500/year)

Because Seentrix offers services to EU data subjects (landing-page visitors,
newsletter, customer signups), UK GDPR + EU GDPR Art. 27 require a named
EU representative. This is a service, not a lawyer:

| Provider | Rough cost | Notes |
|---|---|---|
| [Prighter](https://prighter.com/) | €500/year | Pay monthly, GDPR + UK GDPR included |
| [IVO EU Representative](https://www.ivo-rep.com/) | €790/year | Includes DPO support if you ever need one |
| [VGS Global](https://www.vgsglobal.com/) | ~€600/year | |

You receive:
- An EU legal address and named rep
- One line to paste into your privacy policy

Skip this step **only** if you geoblock the EU. Since Seentrix sells to
EU manufacturers, that's not an option.

---

## Step 6 — Code changes I'll make once you're incorporated

Tell me these four things and I'll do a single pass across the repo:

1. Companies House company number (8 digits)
2. Registered office address (one-line format)
3. ICO registration number
4. EU Art. 27 representative name + address

I'll substitute across:

- `src/app/[locale]/legal/terms/page.tsx` — `{LEGAL_ENTITY_NAME}`, `{REGISTERED_ADDRESS}`, `{JURISDICTION}`, `{VENUE}`, `{SUPPORT_EMAIL}`, etc.
- `src/app/[locale]/legal/privacy/page.tsx` — add ICO block, EU rep block, UK GDPR clauses
- `src/app/[locale]/legal/dpa/page.tsx` — add **UK IDTA (International Data Transfer Agreement)** as an annex alongside the EU SCCs
- `src/app/[locale]/legal/cookies/page.tsx` — minor edits for UK jurisdiction
- `src/lib/pdf/components/pdf-footer.tsx` — legal footer on DoC + incident report PDFs
- `messages/en/*.json` + `messages/de/*.json` — any translated legal strings

Then remove the amber "Template — needs lawyer review" banner **only after**
a lawyer signs off the final substituted text.

---

## Step 7 — Stripe account transition

Your current Stripe account is a sandbox/test account under your personal
name (`acct_1TMueHAJCe36pYCk`, per `stripe config --list`). To take real
money as Seentrix Ltd you need to:

1. [dashboard.stripe.com → Activate your account](https://dashboard.stripe.com/account/onboarding)
2. Business structure: **Company → Private limited company**
3. Business details:
   - Legal name: `Seentrix Ltd`
   - Tax ID: your company number
   - Registered address (same as Companies House)
   - Business website: `https://seentrix.com`
   - Industry: `Software`
4. Representative: you (director)
5. Bank account: the one you opened in Step 2
6. Verification documents:
   - Certificate of incorporation (PDF from Companies House)
   - Proof of address (utility bill or bank statement dated within 3 months)
   - Your passport or UK driver's licence
7. Submit. Approval usually takes 1–3 business days.

Once Stripe is live:
- **Switch `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_*` values in Vercel** from `sk_test_*` / `pk_test_*` to live keys
- **Create a new webhook endpoint at the live URL** (I'll handle this via Stripe CLI — same flow as the test webhook I already wired)
- **Rotate the STRIPE_WEBHOOK_SECRET** to the new live one
- Double-check Stripe Tax is enabled so EU VAT reverse-charge works correctly

---

## Ongoing UK obligations (annual)

Once a year, without fail:

| What | When | How |
|---|---|---|
| **Confirmation statement** (Companies House) | Within 12 months of anniversary | £34 online, 5 minutes |
| **Annual accounts** (Companies House) | Within 9 months of fiscal year end | Free — use the [micro-entity simplified format](https://www.gov.uk/annual-accounts/microentities-small-and-dormant-companies). For a small SaaS, an accountant costs £500–1,500. |
| **Corporation Tax return (CT600)** | Within 12 months of fiscal year end | Accountant or FreeAgent/Xero/etc |
| **ICO fee** | Annual renewal | £52 online |
| **EU Art. 27 rep** | Annual renewal | Your provider invoices you |

Set calendar reminders for all five.

---

## Ballpark year-one cost

| Item | Cost |
|---|---|
| Companies House registration | £12 |
| Registered office service | £30–50 |
| Business bank account (Wise) | £45 one-time |
| ICO registration | £52 |
| EU Art. 27 representative | £450–700 (€500–800) |
| Accountant for first year-end | £500–1,500 (optional but recommended) |
| Lawyer review of legal pages | £300–600 one-time |
| **Total year 1** | **~£1,400–3,000** |

Most of it is the accountant + lawyer; everything else is under £200.

---

## Tell me when…

1. You have the **Companies House company number** → I'll substitute `{LEGAL_ENTITY_NAME}` and start drafting the legal-page fills
2. You've picked your **registered address** → I'll substitute that too
3. You've registered with **ICO** → one paragraph added to privacy policy
4. You've chosen an **EU Art. 27 representative** → one paragraph added to privacy policy + DPA
5. **Stripe live mode is approved** → I'll help rotate the keys + webhook safely without downtime

Then the only remaining step is the lawyer review, and we're launch-ready.
