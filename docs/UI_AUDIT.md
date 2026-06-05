# Pre-login UI audit (vs. design language)

Audited the public, pre-login surface against `docs/DESIGN_LANGUAGE.md`
(extracted from the Figma source of truth). Verified statically (token usage)
and visually (live screenshots of staging at desktop 1440px + mobile 390px).

## Verdict: consistent and on-brand

The pre-login pages already apply the design language correctly. No rogue
colors, no broken layouts, no text overflow found.

### Static analysis
- No arbitrary Tailwind color classes (`bg-[#...]`) in pre-login pages.
- No non-token utility colors (`bg-gray-500`, `text-blue-600`, etc.) — every
  surface uses the semantic tokens (`bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground`, `bg-primary`, `text-primary`, `--accent`).
- The only raw hex are small per-card `accent` data values in
  `features-section.tsx`, `how-it-works-section.tsx`, `audience-section.tsx`,
  and they exactly match the token values (`#066DE6`, `#FF6D00`, `#FF9E55`).
  Optional cleanliness improvement: reference the CSS vars instead. Not a
  visible issue.

### Visual checks (staging)
- **Pricing**: light theme, white tier cards with soft shadow, Professional
  highlighted with a blue "Most Popular" badge, blue/navy typography, orange
  "2 months free" + "Coming soon" accents. Prices €0 / €49 / €179 /
  "Coming soon" render correctly with no overflow. Compare-plans table reads
  cleanly with blue checks and orange coming-soon badges. Responsive: stacks
  to a single column with a hamburger menu on mobile.
- **Landing hero**: blue eyebrow label, two-tone navy+blue headline, muted
  body, primary blue + secondary outline CTAs, CRA countdown, dotted
  background. On-brand.
- **Login**: centered white card, navy heading, light-grey input fills
  matching the Figma input style, full-width blue button, blue links.

## Foundations confirmed
`src/app/globals.css` already encodes the full Figma design system (blue/orange/
grey ramps, radii 8/10/15/16, soft wide card shadows, Plus Jakarta Sans). New
work should keep using these tokens — see `docs/DESIGN_LANGUAGE.md`.
