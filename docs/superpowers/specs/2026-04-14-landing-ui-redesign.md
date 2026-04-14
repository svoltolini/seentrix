# Landing Page & Pre-Login UI Redesign

**Date:** 2026-04-14
**Status:** Approved
**Approach:** B — Modern Layout Restructure with GSAP ScrollTrigger

## Summary

Redesign all pre-login pages (landing, blog, auth) with improved layout structure, GSAP ScrollTrigger staggered animations, and a split-screen auth layout. Keep existing colors, typography, and component library. Focus on section composition, card-based containers, and scroll-driven motion.

## Scope

### In Scope
- Landing page: Hero, Stats, Features, Audience, Pricing, Timeline, Newsletter sections
- Landing header (no changes needed — already good)
- Landing footer (multi-column redesign)
- Blog listing page (card improvements)
- Auth pages: Login, Signup, Forgot Password, Reset Password (split-screen layout)
- GSAP ScrollTrigger integration
- Responsive behavior for all changes

### Out of Scope
- Dashboard/app pages (post-login)
- Onboarding flow
- Pricing standalone page (`/pricing`)
- Blog post detail pages
- Content/copy changes
- i18n content/copy changes (only structural translation keys for new UI elements)

## Technical Foundation

### New Dependency
- `gsap` — GSAP core + ScrollTrigger plugin (~45KB)

### New Components

**`src/components/gsap-provider.tsx`** (Client Component)
- Registers `ScrollTrigger` plugin once at mount
- Placed in `(marketing)/layout.tsx` — only affects marketing pages, not the dashboard

**`src/components/stagger-reveal.tsx`** (Client Component)
- Wraps a section and animates direct children with staggered fade-up
- Props: `stagger` (default 0.12s), `y` (default 40px), `duration` (default 0.8s)
- Uses `gsap.from()` with ScrollTrigger `start: "top 85%"` trigger
- Children opt in via `data-reveal` attribute or all direct children animate by default
- Handles cleanup on unmount

### Removed Components
- `src/components/scroll-reveal.tsx` — replaced entirely by GSAP system

### Section Background Pattern
- Odd sections: `bg-background` (default)
- Even sections: `bg-card/50` with subtle top border (`border-t border-border/50`)
- All sections increase padding: `py-24 lg:py-32` (up from `py-20 lg:py-28`)

## Section Designs

### 1. Hero Section
**File:** `src/app/[locale]/(marketing)/_components/hero-section.tsx`

Changes:
- Add CSS dot grid pattern background (radial-gradient) covering the full section
- Keep existing gradient blob but soften it (reduce opacity to 0.25)
- Increase padding: `pt-20 pb-28 lg:pt-28 lg:pb-36`
- Content max-width stays `max-w-5xl`
- Countdown timer digits: redesign each unit into bordered cards (`bg-card border-border rounded-xl p-3`) — digit on top, label below
- Add scroll indicator (animated chevron) at bottom of section
- GSAP entrance: sequential cascade — badge → title L1 → title L2 → subtitle → CTAs → countdown → scroll indicator (0.1s intervals)

### 2. Stats/Problem Section
**File:** `src/app/[locale]/(marketing)/_components/problem-section.tsx`

Changes:
- Background: `bg-card/50` with top border
- Each stat wrapped in a card: `bg-card border-border rounded-2xl p-8`
- Stat numbers get GSAP counter animation (rolls from 0 to value on scroll)
- Grid stays `grid-cols-3` desktop, stacks mobile
- GSAP: cards stagger left-to-right (0.15s), then counters animate

### 3. Features Section (Bento Grid)
**File:** `src/app/[locale]/(marketing)/_components/features-section.tsx`

Changes:
- Switch from 4-column to bento layout: 3-column grid where the first item (Assessment) spans 2 columns as a hero card, and the remaining 3 items each take 1 column:
  - `grid-cols-1 md:grid-cols-3` with first child `md:col-span-2`
  - Hero card gets extra internal padding and larger icon
- Each card: `bg-card border-border rounded-2xl p-8` with left-aligned text
- Icon in a small gradient circle (`bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl p-3`)
- Hover: border brightens (`border-primary/30`) + subtle lift (`-translate-y-1`)
- GSAP: hero card first, then 3 cards stagger

### 4. Audience Section (Alternating Layout)
**File:** `src/app/[locale]/(marketing)/_components/audience-section.tsx`

Changes:
- Background: `bg-card/50`
- Replace 3-column grid with alternating two-column rows:
  - Row 1 (Industrial): Large icon left, text right
  - Row 2 (IoT): Text left, large icon right
  - Row 3 (Software): Large icon left, text right
- "Visual" side: Large icon in a gradient-bordered rounded container (64x64 or larger)
- Text side: Title + description, left-aligned, `max-w-md`
- Gap between rows: `gap-16 lg:gap-20`
- CTA stays centered below
- GSAP: each row reveals as a unit, icon slides from its side, text fades up

### 5. Pricing Section
**File:** `src/app/[locale]/(marketing)/_components/pricing-preview.tsx`

Changes:
- Cards: `bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl`
- Professional tier: gradient border effect — wrapper div with `bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 p-px rounded-2xl`, inner div with `bg-card rounded-[calc(1rem-1px)]`
- All cards: hover lift `transition-transform hover:-translate-y-1`
- Checkmarks: replace text `✓` with `<span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">✓</span>`
- Price: increase to `text-5xl font-extrabold`
- GSAP: 4 cards stagger left-to-right

### 6. Timeline Section
**File:** `src/app/[locale]/(marketing)/_components/timeline-section.tsx`

Changes:
- Desktop horizontal line: starts as `bg-border`, GSAP ScrollTrigger fills it with gradient (`from-blue-500 via-purple-500 to-orange-500`) linked to scroll progress
- Implementation: overlay div with gradient background, width animated from 0% to 100% as scroll progress goes 0→1
- Milestone dots: scale from 0.8 to 1.0 when their portion of the line fills
- Content: each milestone text block gets a subtle card background
- Mobile vertical: same scroll-linked fill on the vertical track
- GSAP: `ScrollTrigger.create({ trigger, start, end, onUpdate })` to drive line fill width/height

### 7. Newsletter Section
**File:** `src/app/[locale]/(marketing)/_components/newsletter-section.tsx`

Changes:
- Full-width background gradient band: `bg-gradient-to-r from-primary/5 via-purple-500/5 to-orange-500/5`
- Inner container: `max-w-4xl rounded-3xl border border-border bg-card p-10 lg:p-14`
- Form layout: horizontal on desktop (input + button side by side), stacked on mobile
- Input field wider, `max-w-sm` → `flex-1`
- GSAP: container fades up and scales from 0.97 to 1.0

### 8. Footer
**File:** `src/app/[locale]/(marketing)/_components/landing-footer.tsx`

Changes:
- Multi-column grid layout (4 columns on desktop, 2 on tablet, stacked mobile):
  - Col 1: Logo + tagline + location
  - Col 2: Product (Features, Pricing, Timeline — anchor links)
  - Col 3: Resources (Blog — page link)
  - Col 4: Legal (Impressum, Privacy, Terms)
- Bottom bar: horizontal separator + copyright on left + language switcher on right
- New translation keys needed for column headers: `footer.product`, `footer.resources`, `footer.legal`
- No scroll animations

### 9. Blog Listing Page
**File:** `src/app/[locale]/(marketing)/blog/page.tsx` + `blog/_components/blog-card.tsx`

Changes:
- Blog cards: add a placeholder gradient area at top of card (for future thumbnails) — `h-40 rounded-t-xl bg-gradient-to-br from-primary/10 to-purple-500/10`
- Card body: `p-6` with title, date, reading time, tag badge
- Hover: lift effect + border brightens
- Wrap page in GSAP stagger reveal for the grid items

### 10. Auth Pages (Split Screen)
**File:** `src/app/[locale]/auth/layout.tsx`

Changes:
- Replace centered layout with split-screen:
  - Left panel (hidden on mobile, 50% on lg+):
    - `bg-gradient-to-br from-background via-card to-background`
    - CSS dot grid pattern overlay (matching hero)
    - Centered content: large Logo, tagline, 3 feature highlights with icons
  - Right panel (100% mobile, 50% lg+):
    - Form centered vertically with `max-w-sm` container
    - Logo + name above form (visible on mobile only since left panel has it on desktop)
- Mobile: left panel hidden, right panel fills screen with logo on top (similar to current layout)
- Subtle GSAP entrance animation on the form (fade-up on mount)
- Applies to: login, signup, forgot-password, reset-password

## New Translation Keys

Footer columns:
- `landing.footer.product` — "Product"
- `landing.footer.resources` — "Resources"
- `landing.footer.legal` — "Legal"

Auth left panel:
- `auth.branding.tagline` — Short tagline
- `auth.branding.feature1` — Feature highlight 1
- `auth.branding.feature2` — Feature highlight 2
- `auth.branding.feature3` — Feature highlight 3

## Files Changed

### New Files
- `src/components/gsap-provider.tsx`
- `src/components/stagger-reveal.tsx`

### Modified Files
- `src/app/[locale]/(marketing)/layout.tsx` — add GsapProvider wrapper
- `src/app/[locale]/(marketing)/page.tsx` — replace ScrollReveal with StaggerReveal
- `src/app/[locale]/(marketing)/_components/hero-section.tsx` — dot grid, countdown cards, scroll indicator
- `src/app/[locale]/(marketing)/_components/problem-section.tsx` — stat cards, counter animation
- `src/app/[locale]/(marketing)/_components/features-section.tsx` — bento grid, card containers
- `src/app/[locale]/(marketing)/_components/audience-section.tsx` — alternating layout
- `src/app/[locale]/(marketing)/_components/pricing-preview.tsx` — glassmorphic cards, gradient border
- `src/app/[locale]/(marketing)/_components/timeline-section.tsx` — scroll-linked line fill
- `src/app/[locale]/(marketing)/_components/newsletter-section.tsx` — CTA band, horizontal form
- `src/app/[locale]/(marketing)/_components/landing-footer.tsx` — multi-column layout
- `src/app/[locale]/(marketing)/blog/page.tsx` — stagger reveal wrapper
- `src/app/[locale]/(marketing)/blog/_components/blog-card.tsx` — thumbnail, hover, badges
- `src/app/[locale]/auth/layout.tsx` — split-screen layout
- `messages/en.json` — new footer + auth branding keys
- `messages/de.json` — new footer + auth branding keys
- `package.json` — add gsap dependency

### Removed Files
- `src/components/scroll-reveal.tsx` — replaced by GSAP system

## Performance Considerations
- GSAP + ScrollTrigger adds ~45KB (gzipped ~15KB) — acceptable for a marketing site
- All animations use `will-change: transform, opacity` for GPU acceleration
- ScrollTrigger instances are cleaned up on unmount
- No scroll jacking or pinning — natural scroll behavior preserved
- Dot grid pattern is pure CSS (no image assets)
