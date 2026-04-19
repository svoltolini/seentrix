# Supabase auth email templates

Light-themed HTML emails designed for the Seentrix brand, tuned for email-
client compatibility (Outlook, Gmail app, Apple Mail, dark-mode-aware).

## How to install

1. Open [Supabase → Auth → Email Templates](https://supabase.com/dashboard/project/accfirbiiejappwqpvwx/auth/templates).
2. For each template below, pick the matching tab, replace the default
   markup with the corresponding `.html` file in this folder, and save.
3. Subject lines are below too — paste them in the "Subject heading"
   field of each template.

| Supabase template tab | File | Subject heading |
|---|---|---|
| Confirm signup | [confirm-signup.html](confirm-signup.html) | Confirm your Seentrix account |
| Invite user | [invite-user.html](invite-user.html) | You've been invited to Seentrix |
| Magic Link | [magic-link.html](magic-link.html) | Your Seentrix sign-in link |
| Change Email Address | [change-email.html](change-email.html) | Confirm your new email for Seentrix |
| Reset Password | [reset-password.html](reset-password.html) | Reset your Seentrix password |
| Reauthentication | [reauthentication.html](reauthentication.html) | Confirm it's you — Seentrix |

## Design notes

- Light background, orange (`#EA580C`) accents, Manrope font with
  safe system-font fallbacks.
- 560px max width — the consensus email-safe width.
- Inline styles only. No `<style>` blocks (Outlook strips them in some
  contexts), no web fonts loaded via `<link>` (most clients ignore
  them anyway).
- CTA is a rounded orange button with a plain `href` — no JavaScript,
  no tracking pixels, no background images. Plain text URL shown below
  the button as a fallback.
- Footer repeats the same seentrix.com link for trust + lists the
  physical address and a link to the privacy policy (GDPR best
  practice).

## Design compromise: light vs dark

The app is dark-themed. These emails are light-themed on purpose:

- Most email clients render light emails reliably; dark emails break
  badly in Outlook desktop and Gmail for Android.
- Spam filters treat light-themed transactional emails as less
  suspicious (fewer false-positive "phishing" flags).
- Dark-mode-aware clients (iOS Mail, Gmail) will invert colours
  automatically.

If you want a dark variant later for marketing/newsletter emails,
that's fine — transactional auth emails benefit most from light.
