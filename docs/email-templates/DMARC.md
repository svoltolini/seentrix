# DMARC for seentrix.com

## Current record (`_dmarc.seentrix.com`, TXT)

```
v=DMARC1; p=none; rua=mailto:samuel.voltolini@icloud.com; pct=100; aspf=r; adkim=r;
```

`p=none` is monitor-only: it never affects delivery. It's the correct
starting point and we've confirmed authentication is healthy:

- **DKIM** — published at `resend._domainkey.seentrix.com`, signs
  `d=seentrix.com` → aligned.
- **SPF** — the Resend return-path `send.seentrix.com` carries the SPF
  include → aligned on the bounce domain.
- **DMARC** — passes because DKIM aligns.

Because alignment is already passing for the only sender (Resend), we can
move to enforcement. Enforcement (`p=quarantine`/`p=reject`) is what makes
mailbox providers trust the domain more — and it is the lever that most
helps move mail out of Junk over time.

## Recommended next step — quarantine with a percentage ramp

Replace the TXT value at `_dmarc.seentrix.com` with:

### Step 1 (start here — quarantine 25%)
```
v=DMARC1; p=quarantine; pct=25; rua=mailto:samuel.voltolini@icloud.com; aspf=r; adkim=r;
```

### Step 2 (after ~1-2 weeks of clean reports — quarantine 100%)
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:samuel.voltolini@icloud.com; aspf=r; adkim=r;
```

### Step 3 (optional, later — full reject)
```
v=DMARC1; p=reject; pct=100; rua=mailto:samuel.voltolini@icloud.com; aspf=r; adkim=r;
```

## Notes

- Keep `rua=` so you keep receiving aggregate reports. Consider a dedicated
  alias (e.g. `dmarc@seentrix.com`) instead of a personal inbox, and/or a
  free DMARC report parser, since the raw reports are XML.
- Do **not** use `pct=0` with `p=quarantine` — it is effectively `p=none`
  and provides no protection.
- `aspf=r; adkim=r;` keep relaxed alignment, which is correct for the
  Resend subdomain return-path setup. Do not switch to strict (`s`) unless
  you verify the From domain matches exactly.
- Set a moderate TTL (e.g. 3600s) on the record during rollout. Allow up to
  24h for receivers to honor changes.

## Why staging emails land in Junk (separate from DMARC)

A brand-new sending domain has little reputation, and strict providers
(notably iCloud/Apple Mail) route such mail to Junk even when SPF/DKIM/DMARC
all pass. This resolves with:

1. Marking the first emails "Not Junk" and adding the sender to Contacts.
2. Sending a steady, low volume of real mail so reputation builds.
3. Advancing DMARC to enforcement as above.

This is expected warmup behavior, not a misconfiguration.
