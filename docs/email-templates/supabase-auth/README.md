# Supabase auth email templates

Light-themed HTML emails matching the Seentrix app design, tuned for
email-client compatibility (Outlook, Gmail, Apple Mail). These are the
source of truth for the auth emails configured in **both** Supabase
projects (production and staging).

## How to install

1. Open Supabase → **Authentication → Emails → Templates** for the project:
   - Production: `accfirbiiejappwqpvwx`
   - Staging: `ebaunhihbdsazhobattq`
2. For each template below, pick the matching tab, replace the markup with
   the corresponding `.html` file in this folder, and save.
3. Paste the subject line into the "Subject heading" field of each template.

| Supabase template tab | File | Subject heading |
|---|---|---|
| Confirm signup | [confirm-signup.html](confirm-signup.html) | Confirm your Seentrix account |
| Invite user | [invite-user.html](invite-user.html) | You've been invited to Seentrix |
| Magic Link | [magic-link.html](magic-link.html) | Your Seentrix sign-in link |
| Change Email Address | [change-email.html](change-email.html) | Confirm your new email address |
| Reset Password | [reset-password.html](reset-password.html) | Reset your Seentrix password |
| Reauthentication | [reauthentication.html](reauthentication.html) | Your Seentrix verification code |

## Template variables

These use the standard Supabase Go-template variables, which are identical
across projects:

- `{{ .ConfirmationURL }}` — confirm signup, invite, magic link, change
  email, reset password.
- `{{ .Token }}` — the 6-digit code used by the reauthentication template.
- `{{ .Email }}` / `{{ .NewEmail }}` — shown in the change-email template.

## Design notes

- Palette taken from the app's design tokens (`src/app/globals.css`):
  - Background `#F6F7FA`, card `#FFFFFF`, text `#2C3659`,
    muted `#8A92A8`, primary/brand blue `#066DE6`, border `#E5E6E7`.
- 560px max width — the consensus email-safe width.
- Inline styles only. No `<style>` blocks, no web fonts via `<link>`,
  no tracking pixels or background images.
- CTA is a rounded brand-blue button with a plain `href`, plus a plain-text
  URL fallback below the button. MSO (Outlook) VML button fallback included.
- Footer links to seentrix.com, Privacy, and Terms.

## Deliverability

The sending domain (`seentrix.com`) authenticates via Resend:
- DKIM published at `resend._domainkey.seentrix.com` (signs `d=seentrix.com`).
- Return-path `send.seentrix.com` carries the SPF include.
- DMARC at `_dmarc.seentrix.com`.

New domains are commonly filtered to Junk by strict providers (e.g. iCloud)
until reputation builds. Marking the first emails "Not Junk" and tightening
DMARC to `p=quarantine` once alignment is confirmed both help. See
`docs/email-templates/DMARC.md` for the recommended record.
