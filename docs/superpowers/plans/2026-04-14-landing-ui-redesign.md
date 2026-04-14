# Landing Page UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize all pre-login pages with improved layouts, GSAP ScrollTrigger staggered animations, and split-screen auth.

**Architecture:** Replace the CSS Intersection Observer animation system with GSAP ScrollTrigger. Add a `GsapProvider` at the marketing layout level and a reusable `StaggerReveal` component. Redesign each landing section's layout (bento grid, alternating rows, stat cards, CTA band). Convert auth pages from centered card to split-screen. All changes are scoped to the `(marketing)` route group and `/auth` layout — dashboard is untouched.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, GSAP + ScrollTrigger, next-intl, Base-UI components

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `gsap` dependency |
| `src/components/gsap-provider.tsx` | Create | Register ScrollTrigger plugin once |
| `src/components/stagger-reveal.tsx` | Create | Reusable GSAP staggered scroll reveal |
| `src/components/scroll-reveal.tsx` | Delete | Replaced by GSAP system |
| `src/app/[locale]/(marketing)/layout.tsx` | Modify | Wrap children in GsapProvider |
| `src/app/[locale]/(marketing)/page.tsx` | Modify | Remove ScrollReveal, use StaggerReveal |
| `src/app/[locale]/(marketing)/_components/hero-section.tsx` | Modify | Dot grid bg, GSAP cascade, scroll indicator |
| `src/app/[locale]/(marketing)/_components/countdown-timer.tsx` | No change | Already uses card design |
| `src/app/[locale]/(marketing)/_components/problem-section.tsx` | Modify | Stat cards, counter animation, alt bg |
| `src/app/[locale]/(marketing)/_components/features-section.tsx` | Modify | Bento grid, card containers, hover |
| `src/app/[locale]/(marketing)/_components/audience-section.tsx` | Modify | Alternating 2-col layout, alt bg |
| `src/app/[locale]/(marketing)/_components/pricing-preview.tsx` | Modify | Glassmorphic cards, gradient border |
| `src/app/[locale]/(marketing)/_components/timeline-section.tsx` | Modify | Scroll-linked gradient fill |
| `src/app/[locale]/(marketing)/_components/newsletter-section.tsx` | Modify | CTA band, horizontal form |
| `src/app/[locale]/(marketing)/_components/landing-footer.tsx` | Modify | Multi-column grid layout |
| `src/app/[locale]/(marketing)/blog/page.tsx` | Modify | Add StaggerReveal wrapper |
| `src/app/[locale]/(marketing)/blog/_components/blog-card.tsx` | Modify | Thumbnail gradient, hover lift |
| `src/app/[locale]/auth/layout.tsx` | Modify | Split-screen layout |
| `messages/en/landing.json` | Modify | Add footer column headers |
| `messages/de/landing.json` | Modify | Add footer column headers |
| `messages/en/auth.json` | Modify | Add branding keys |
| `messages/de/auth.json` | Modify | Add branding keys |

---

### Task 1: Install GSAP and Create Provider

**Files:**
- Modify: `package.json`
- Create: `src/components/gsap-provider.tsx`

- [ ] **Step 1: Install gsap**

```bash
npm install gsap
```

- [ ] **Step 2: Create GsapProvider component**

Create `src/components/gsap-provider.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/gsap-provider.tsx
git commit -m "feat: install gsap and create GsapProvider component"
```

---

### Task 2: Create StaggerReveal Component

**Files:**
- Create: `src/components/stagger-reveal.tsx`

- [ ] **Step 1: Create the StaggerReveal component**

Create `src/components/stagger-reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  selector?: string;
}

export function StaggerReveal({
  children,
  className,
  stagger = 0.12,
  y = 40,
  duration = 0.8,
  selector,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = selector
      ? el.querySelectorAll(selector)
      : el.querySelectorAll(":scope > *");

    if (targets.length === 0) return;

    gsap.set(targets, { opacity: 0, y });

    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, y, duration, selector]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/stagger-reveal.tsx
git commit -m "feat: create StaggerReveal component with GSAP ScrollTrigger"
```

---

### Task 3: Wire GsapProvider into Marketing Layout and Landing Page

**Files:**
- Modify: `src/app/[locale]/(marketing)/layout.tsx`
- Modify: `src/app/[locale]/(marketing)/page.tsx`
- Delete: `src/components/scroll-reveal.tsx`

- [ ] **Step 1: Add GsapProvider to marketing layout**

Replace the entire contents of `src/app/[locale]/(marketing)/layout.tsx` with:

```tsx
import { GsapProvider } from "@/components/gsap-provider";
import { LandingHeader } from "./_components/landing-header";
import { LandingFooter } from "./_components/landing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Replace ScrollReveal with direct rendering in landing page**

Replace the entire contents of `src/app/[locale]/(marketing)/page.tsx` with:

```tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "./_components/hero-section";
import { ProblemSection } from "./_components/problem-section";
import { FeaturesSection } from "./_components/features-section";
import { AudienceSection } from "./_components/audience-section";
import { PricingPreview } from "./_components/pricing-preview";
import { TimelineSection } from "./_components/timeline-section";
import { NewsletterSection } from "./_components/newsletter-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: `Seentrix — ${t("hero.titleLine1")} ${t("hero.titleLine2")}`,
    description: t("hero.subtitle"),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <AudienceSection />
      <PricingPreview />
      <TimelineSection />
      <NewsletterSection />
    </>
  );
}
```

Note: Each section component will internally handle its own GSAP animations (Tasks 4-10). The `ScrollReveal` wrapper is no longer needed — GSAP triggers are set per-section.

- [ ] **Step 3: Delete the old ScrollReveal component**

```bash
rm src/components/scroll-reveal.tsx
```

- [ ] **Step 4: Verify no other files import scroll-reveal**

```bash
grep -r "scroll-reveal" src/ --include="*.tsx" --include="*.ts" -l
```

Expected: No results (or only the deleted file path if grep still indexes it).

- [ ] **Step 5: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A src/app/[locale]/'(marketing)'/layout.tsx src/app/[locale]/'(marketing)'/page.tsx src/components/scroll-reveal.tsx
git commit -m "feat: wire GsapProvider into marketing layout, remove ScrollReveal"
```

---

### Task 4: Redesign Hero Section

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/hero-section.tsx`

- [ ] **Step 1: Rewrite hero-section.tsx with dot grid, GSAP cascade, and scroll indicator**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/hero-section.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const items = el.querySelectorAll("[data-hero-reveal]");
    gsap.set(items, { opacity: 0, y: 20, filter: "blur(4px)" });

    const ctx = gsap.context(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  function scrollToPricing() {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden px-6 pt-20 pb-28 lg:pt-28 lg:pb-36"
    >
      {/* Dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Softened gradient blob */}
      <div
        className="pointer-events-none absolute -left-20 -top-10 h-[405px] w-[405px] animate-[hero-blob_8s_ease-in-out_infinite] rounded-full opacity-25 blur-[200px]"
        style={{
          background: "linear-gradient(to bottom, #3B82F6, #8B5CF6)",
        }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <Badge
          data-hero-reveal
          variant="default"
          className="px-4 py-1.5 text-sm font-medium"
        >
          {t("badge")}
        </Badge>

        <h1 data-hero-reveal className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl [&>span:last-child]:font-black">
          <span className="text-foreground">{t("titleLine1")}</span>
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#F97316] bg-clip-text text-transparent">
            {t("titleLine2")}
          </span>
        </h1>

        <p
          data-hero-reveal
          className="max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          {t("subtitle")}
        </p>

        <div
          data-hero-reveal
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link href="/auth/signup" className={buttonVariants({ size: "lg" })}>
            {t("cta")}
          </Link>
          <Button variant="outline" size="lg" onClick={scrollToPricing}>
            {t("ctaSecondary")}
          </Button>
        </div>

        <div data-hero-reveal className="mt-4">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {t("countdown.title")}
          </p>
          <CountdownTimer />
        </div>

        {/* Scroll indicator */}
        <div data-hero-reveal className="mt-6 animate-bounce">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify dev server renders correctly**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/hero-section.tsx
git commit -m "feat: redesign hero with dot grid, GSAP cascade, scroll indicator"
```

---

### Task 5: Redesign Problem/Stats Section

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/problem-section.tsx`

- [ ] **Step 1: Rewrite problem-section.tsx with stat cards, counter animation, alternating background**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/problem-section.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const stats = ["stat1", "stat2", "stat3"] as const;

export function ProblemSection() {
  const t = useTranslations("landing.problem");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-stat-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onComplete: () => {
          // Counter animations after cards are visible
          el.querySelectorAll("[data-counter]").forEach((counter) => {
            const target = counter.getAttribute("data-counter") ?? "";
            const numericMatch = target.match(/[\d.]+/);
            if (!numericMatch) return;

            const endVal = parseFloat(numericMatch[0]);
            const prefix = target.slice(0, target.indexOf(numericMatch[0]));
            const suffix = target.slice(
              target.indexOf(numericMatch[0]) + numericMatch[0].length
            );

            gsap.from(
              { val: 0 },
              {
                val: endVal,
                duration: 1.5,
                ease: "power2.out",
                onUpdate() {
                  const current = Math.round(this.targets()[0].val);
                  counter.textContent = `${prefix}${current}${suffix}`;
                },
              }
            );
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border/50 bg-card/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((key) => (
            <div
              key={key}
              data-stat-card
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center"
            >
              <span
                data-counter={t(`stats.${key}.value`)}
                className="text-5xl font-bold text-primary sm:text-6xl"
              >
                {t(`stats.${key}.value`)}
              </span>
              <span className="mt-4 text-base font-semibold text-foreground">
                {t(`stats.${key}.label`)}
              </span>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t(`stats.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/problem-section.tsx
git commit -m "feat: redesign stats section with cards, counter animation, alt bg"
```

---

### Task 6: Redesign Features Section (Bento Grid)

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/features-section.tsx`

- [ ] **Step 1: Rewrite features-section.tsx with bento grid layout**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/features-section.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";

const modules = [
  { key: "assessment", icon: "shield-check" },
  { key: "checklist", icon: "checkmark-badge-01-stroke-rounded" },
  { key: "sbom", icon: "package-open-stroke-rounded" },
  { key: "documents", icon: "pdf-01-stroke-rounded" },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing.features");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-feature-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="scroll-mt-20 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((mod, i) => (
            <div
              key={mod.key}
              data-feature-card
              className={cn(
                "group flex flex-col rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30",
                i === 0 && "md:col-span-2"
              )}
            >
              <div
                className={cn(
                  "mb-6 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-[#8B5CF6]/20",
                  i === 0 ? "h-16 w-16" : "h-14 w-14"
                )}
              >
                <HugeIcon
                  name={mod.icon}
                  size={i === 0 ? 32 : 28}
                  className="text-foreground"
                />
              </div>

              <h3
                className={cn(
                  "font-bold text-foreground",
                  i === 0 ? "text-xl" : "text-lg"
                )}
              >
                {t(`modules.${mod.key}.title`)}
              </h3>

              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {t(`modules.${mod.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/features-section.tsx
git commit -m "feat: redesign features section as bento grid with card hover"
```

---

### Task 7: Redesign Audience Section (Alternating Layout)

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/audience-section.tsx`

- [ ] **Step 1: Rewrite audience-section.tsx with alternating two-column layout**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/audience-section.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const segments = [
  { key: "industrial", icon: "circuit-board-stroke-rounded" },
  { key: "iot", icon: "chip-stroke-rounded" },
  { key: "software", icon: "visual-studio-code-stroke-rounded" },
] as const;

export function AudienceSection() {
  const t = useTranslations("landing.audience");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const rows = el.querySelectorAll("[data-audience-row]");

    rows.forEach((row) => {
      const icon = row.querySelector("[data-audience-icon]");
      const text = row.querySelector("[data-audience-text]");
      if (!icon || !text) return;

      const isReversed = row.getAttribute("data-reversed") === "true";
      gsap.set(icon, { opacity: 0, x: isReversed ? 40 : -40 });
      gsap.set(text, { opacity: 0, y: 30 });

      gsap.to(icon, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
      gsap.to(text, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.15,
        ease: "power2.out",
        scrollTrigger: { trigger: row, start: "top 85%", once: true },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (el.contains(t.trigger as Element)) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border/50 bg-card/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-16 lg:gap-20">
          {segments.map((seg, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={seg.key}
                data-audience-row
                data-reversed={isReversed}
                className={cn(
                  "flex flex-col items-center gap-8 lg:flex-row lg:gap-16",
                  isReversed && "lg:flex-row-reverse"
                )}
              >
                {/* Icon */}
                <div
                  data-audience-icon
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-[#8B5CF6]/10 lg:h-32 lg:w-32"
                >
                  <HugeIcon
                    name={seg.icon}
                    size={48}
                    className="text-foreground"
                  />
                </div>

                {/* Text */}
                <div data-audience-text className="max-w-md text-center lg:text-left">
                  <h3 className="text-xl font-bold text-foreground">
                    {t(`segments.${seg.key}.title`)}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {t(`segments.${seg.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/auth/signup"
            className={buttonVariants({ size: "lg" })}
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/audience-section.tsx
git commit -m "feat: redesign audience section with alternating layout and GSAP"
```

---

### Task 8: Redesign Pricing Section

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/pricing-preview.tsx`

- [ ] **Step 1: Rewrite pricing-preview.tsx with glassmorphic cards and gradient border**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/pricing-preview.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = ["free", "professional", "business", "enterprise"] as const;

const tierFeatures: Record<string, string[]> = {
  free: ["f1", "f2", "f3"],
  professional: ["f1", "f2", "f3", "f4"],
  business: ["f1", "f2", "f3", "f4"],
  enterprise: ["f1", "f2", "f3", "f4"],
};

export function PricingPreview() {
  const t = useTranslations("landing.pricingPreview");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const cards = el.querySelectorAll("[data-pricing-card]");
    gsap.set(cards, { opacity: 0, y: 40 });

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-20 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const isPro = tier === "professional";
            const isEnterprise = tier === "enterprise";
            const features = tierFeatures[tier];

            const cardInner = (
              <Card
                className={cn(
                  "relative flex h-full flex-col bg-card/80 backdrop-blur-sm",
                  !isPro && "border-border/50",
                  isPro && "border-transparent"
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      variant="default"
                      className="overflow-visible border-primary bg-primary text-primary-foreground"
                    >
                      {t("professional.badge")}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">
                    {t(`${tier}.name`)}
                  </CardTitle>
                  <CardDescription>
                    {t(`${tier}.description`)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-foreground">
                      {t(`${tier}.price`)}
                    </span>
                    {tier !== "free" && (
                      <span className="text-sm text-muted-foreground">
                        {t(`${tier}.period`)}
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                    {features.map((fk) => (
                      <li key={fk} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                          &#10003;
                        </span>
                        {t(`${tier}.features.${fk}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={isEnterprise ? "/pricing" : "/auth/signup"}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: cn(
                        "w-full",
                        !isPro &&
                          "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      ),
                    })}
                  >
                    {isEnterprise ? t("enterprise.cta") : t("getStarted")}
                  </Link>
                </CardContent>
              </Card>
            );

            return (
              <div
                key={tier}
                data-pricing-card
                className={cn(
                  "transition-transform duration-300 hover:-translate-y-1",
                  isPro && "rounded-2xl bg-gradient-to-b from-[#3B82F6] via-[#8B5CF6] to-[#F97316] p-px"
                )}
              >
                {isPro ? (
                  <div className="h-full rounded-[calc(1rem-1px)] bg-card">
                    {cardInner}
                  </div>
                ) : (
                  cardInner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/pricing-preview.tsx
git commit -m "feat: redesign pricing with glassmorphic cards and gradient border"
```

---

### Task 9: Redesign Timeline Section with Scroll-Linked Fill

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/timeline-section.tsx`

- [ ] **Step 1: Rewrite timeline-section.tsx with GSAP scroll-linked gradient fill**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/timeline-section.tsx` with:

```tsx
"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

const milestones = [
  { key: "m1", color: "#3B82F6" },
  { key: "m2", color: "#8B5CF6" },
  { key: "m3", color: "#F97316" },
] as const;

export function TimelineSection() {
  const t = useTranslations("landing.timeline");
  const sectionRef = useRef<HTMLElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Desktop horizontal fill
      if (hLineRef.current) {
        gsap.fromTo(
          hLineRef.current,
          { width: "0%" },
          {
            width: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              end: "bottom 60%",
              scrub: 0.5,
            },
          }
        );
      }

      // Mobile vertical fill
      if (vLineRef.current) {
        gsap.fromTo(
          vLineRef.current,
          { height: "0%" },
          {
            height: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              end: "bottom 60%",
              scrub: 0.5,
            },
          }
        );
      }

      // Dot scale + content fade
      const dots = el.querySelectorAll("[data-milestone-dot]");
      const content = el.querySelectorAll("[data-milestone-content]");

      dots.forEach((dot, i) => {
        gsap.from(dot, {
          scale: 0.6,
          opacity: 0.4,
          duration: 0.5,
          scrollTrigger: {
            trigger: dot,
            start: "top 80%",
            once: true,
          },
        });
        if (content[i]) {
          gsap.from(content[i], {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.2,
            scrollTrigger: {
              trigger: dot,
              start: "top 80%",
              once: true,
            },
          });
        }
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="scroll-mt-20 border-t border-border/50 bg-card/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Horizontal stepper — desktop */}
        <div className="hidden lg:block">
          <div className="mx-auto max-w-5xl">
            <div className="relative flex items-center justify-between">
              {/* Track background */}
              <div className="absolute left-5 right-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
              {/* Gradient fill overlay */}
              <div
                ref={hLineRef}
                className="absolute left-5 top-1/2 h-1 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, #3B82F6, #8B5CF6, #F97316)",
                  width: "0%",
                }}
              />

              {milestones.map((ms, i) => (
                <Fragment key={ms.key}>
                  <div
                    data-milestone-dot
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-md"
                    style={{ backgroundColor: ms.color }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                  {i < milestones.length - 1 && <div className="flex-1" />}
                </Fragment>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              {milestones.map((ms) => (
                <div
                  key={ms.key}
                  data-milestone-content
                  className="flex w-10 flex-col items-center text-center"
                >
                  <div className="flex w-[240px] flex-col items-center rounded-xl border border-border bg-card p-4">
                    <span
                      className="inline-flex rounded-full px-4 py-1 text-sm font-bold text-white"
                      style={{ backgroundColor: ms.color }}
                    >
                      {t(`milestones.${ms.key}.date`)}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-foreground">
                      {t(`milestones.${ms.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`milestones.${ms.key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical stepper — mobile/tablet */}
        <div className="lg:hidden">
          <div className="relative flex flex-col gap-10 pl-10">
            {/* Track background */}
            <div className="absolute bottom-0 left-[15px] top-0 w-1 rounded-full bg-border" />
            {/* Gradient fill overlay */}
            <div
              ref={vLineRef}
              className="absolute left-[15px] top-0 w-1 rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, #3B82F6, #8B5CF6, #F97316)",
                height: "0%",
              }}
            />

            {milestones.map((ms) => (
              <div key={ms.key} className="relative">
                <div
                  data-milestone-dot
                  className="absolute -left-10 top-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background shadow-md"
                  style={{ backgroundColor: ms.color }}
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>

                <div data-milestone-content>
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: ms.color }}
                  >
                    {t(`milestones.${ms.key}.date`)}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-foreground">
                    {t(`milestones.${ms.key}.title`)}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t(`milestones.${ms.key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/timeline-section.tsx
git commit -m "feat: redesign timeline with scroll-linked gradient fill"
```

---

### Task 10: Redesign Newsletter Section (CTA Band)

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/newsletter-section.tsx`

- [ ] **Step 1: Rewrite newsletter-section.tsx as CTA band with horizontal form**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/newsletter-section.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter, type NewsletterState } from "./actions";

export function NewsletterSection() {
  const t = useTranslations("landing.newsletter");
  const locale = useLocale();
  const [state, action, isPending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletter,
    undefined
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(el, { opacity: 0, y: 30, scale: 0.97 });

    const ctx = gsap.context(() => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-gradient-to-r from-primary/5 via-[#8B5CF6]/5 to-[#F97316]/5 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          ref={containerRef}
          className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-10 text-center lg:p-14"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>

          <form
            action={action}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <input type="hidden" name="locale" value={locale} />
            <Input
              type="email"
              name="email"
              placeholder={t("placeholder")}
              required
              className="w-full sm:max-w-sm"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={isPending}
            >
              {t("cta")}
            </Button>
          </form>

          {state?.status === "success" && (
            <p className="mt-4 text-sm font-medium text-success">
              {t("success")}
            </p>
          )}
          {state?.status === "error" && (
            <p className="mt-4 text-sm font-medium text-destructive">
              {t("error")}
            </p>
          )}
          {state?.status === "duplicate" && (
            <p className="mt-4 text-sm font-medium text-warning">
              {t("duplicate")}
            </p>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            {t("privacy")}
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the `./actions` import still resolves**

The newsletter component imports `subscribeNewsletter` from `./actions` — this file lives at `src/app/[locale]/(marketing)/_components/actions.ts`. It is not modified by this task.

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/newsletter-section.tsx
git commit -m "feat: redesign newsletter as CTA band with horizontal form"
```

---

### Task 11: Redesign Footer (Multi-Column) + Translation Keys

**Files:**
- Modify: `src/app/[locale]/(marketing)/_components/landing-footer.tsx`
- Modify: `messages/en/landing.json`
- Modify: `messages/de/landing.json`

- [ ] **Step 1: Add translation keys to en/landing.json**

Add these keys inside the `landing.footer` object in `messages/en/landing.json`:

```json
"product": "Product",
"resources": "Resources",
"legal": "Legal"
```

The resulting `footer` object should be:

```json
"footer": {
  "location": "Rotkreuz, Switzerland",
  "impressum": "Impressum",
  "privacy": "Privacy Policy",
  "terms": "Terms of Service",
  "copyright": "© {year} Seentrix. All rights reserved.",
  "product": "Product",
  "resources": "Resources",
  "legal": "Legal"
}
```

- [ ] **Step 2: Add translation keys to de/landing.json**

Add the same keys in German. Read the existing file first to match style, then add:

```json
"product": "Produkt",
"resources": "Ressourcen",
"legal": "Rechtliches"
```

- [ ] **Step 3: Rewrite landing-footer.tsx with multi-column grid**

Replace the entire contents of `src/app/[locale]/(marketing)/_components/landing-footer.tsx` with:

```tsx
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const tHeader = useTranslations("landing.header");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Logo size={15} className="shrink-0" />
              <span className="text-base font-bold tracking-tight">
                Seentrix
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {t("location")}
            </span>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("product")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#features" className="transition-colors hover:text-foreground">
                {tHeader("features")}
              </a>
              <a href="#pricing" className="transition-colors hover:text-foreground">
                {tHeader("pricing")}
              </a>
              <a href="#timeline" className="transition-colors hover:text-foreground">
                {tHeader("timeline")}
              </a>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("resources")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="/blog" className="transition-colors hover:text-foreground">
                {tHeader("blog")}
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("legal")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="transition-colors hover:text-foreground">
                {t("impressum")}
              </span>
              <span className="transition-colors hover:text-foreground">
                {t("privacy")}
              </span>
              <span className="transition-colors hover:text-foreground">
                {t("terms")}
              </span>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <span className="text-sm text-muted-foreground/60">
            {t("copyright", { year: String(year) })}
          </span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/'(marketing)'/_components/landing-footer.tsx messages/en/landing.json messages/de/landing.json
git commit -m "feat: redesign footer as multi-column grid with translation keys"
```

---

### Task 12: Improve Blog Cards + Page Animation

**Files:**
- Modify: `src/app/[locale]/(marketing)/blog/_components/blog-card.tsx`
- Modify: `src/app/[locale]/(marketing)/blog/page.tsx`

- [ ] **Step 1: Redesign blog-card.tsx with thumbnail gradient and hover lift**

Replace the entire contents of `src/app/[locale]/(marketing)/blog/_components/blog-card.tsx` with:

```tsx
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeIcon } from "@/components/huge-icon";
import type { BlogPostMeta } from "@/lib/blog";

export function BlogCard({
  post,
  minRead,
}: {
  post: BlogPostMeta;
  minRead: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
        {/* Thumbnail placeholder */}
        <div className="h-40 bg-gradient-to-br from-primary/10 to-[#8B5CF6]/10" />

        <CardHeader>
          <div className="mb-2">
            <Badge variant="secondary">{post.category}</Badge>
          </div>
          <CardTitle className="text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4 border-t pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HugeIcon
                name="calendar-03-stroke-rounded"
                size={14}
                className="text-muted-foreground"
              />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeIcon
                name="time-quarter-02-stroke-rounded"
                size={14}
                className="text-muted-foreground"
              />
              {post.readingTime} {minRead}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Add StaggerReveal to blog page grid**

Replace the entire contents of `src/app/[locale]/(marketing)/blog/page.tsx` with:

```tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "./_components/blog-card";
import { StaggerReveal } from "@/components/stagger-reveal";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const baseUrl = "https://seentrix.com";

  return {
    title: `${t("meta.title")} — Seentrix`,
    description: t("meta.description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
      languages: {
        en: `${baseUrl}/en/blog`,
        de: `${baseUrl}/de/blog`,
      },
    },
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: `${baseUrl}/${locale}/blog`,
      type: "website",
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getAllPosts(locale);

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {t("heading")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("subheading")}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("noPosts")}</p>
      ) : (
        <StaggerReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} minRead={t("minRead")} />
          ))}
        </StaggerReveal>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/'(marketing)'/blog/_components/blog-card.tsx src/app/[locale]/'(marketing)'/blog/page.tsx
git commit -m "feat: improve blog cards with thumbnail gradient and stagger reveal"
```

---

### Task 13: Split-Screen Auth Layout + Translation Keys

**Files:**
- Modify: `src/app/[locale]/auth/layout.tsx`
- Modify: `messages/en/auth.json`
- Modify: `messages/de/auth.json`

- [ ] **Step 1: Add branding translation keys to en/auth.json**

Add a `branding` object inside the `auth` object in `messages/en/auth.json`:

```json
"branding": {
  "tagline": "Your CRA compliance platform — from day one and beyond.",
  "feature1": "Assess product scope in minutes",
  "feature2": "Track compliance with guided checklists",
  "feature3": "Manage SBOMs and vulnerabilities continuously"
}
```

- [ ] **Step 2: Add branding translation keys to de/auth.json**

Add the same `branding` object in German:

```json
"branding": {
  "tagline": "Ihre CRA-Compliance-Plattform — von Tag eins an und darüber hinaus.",
  "feature1": "Produktumfang in Minuten bewerten",
  "feature2": "Compliance mit geführten Checklisten verfolgen",
  "feature3": "SBOMs und Schwachstellen kontinuierlich verwalten"
}
```

- [ ] **Step 3: Rewrite auth layout as split-screen**

Replace the entire contents of `src/app/[locale]/auth/layout.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";

const features = [
  { key: "feature1", icon: "shield-check" },
  { key: "feature2", icon: "checkmark-badge-01-stroke-rounded" },
  { key: "feature3", icon: "package-open-stroke-rounded" },
] as const;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tApp = useTranslations("app");
  const tBranding = useTranslations("auth.branding");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    gsap.from(el, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);

  return (
    <div className="flex min-h-dvh">
      {/* Left branded panel — hidden on mobile */}
      <div className="relative hidden w-1/2 items-center justify-center bg-gradient-to-br from-background via-card to-background lg:flex">
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex max-w-sm flex-col items-center text-center">
          <Logo size={40} />
          <h2 className="mt-6 text-2xl font-bold text-foreground">
            Seentrix
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {tBranding("tagline")}
          </p>

          <div className="mt-10 flex flex-col gap-5 text-left">
            {features.map((f) => (
              <div key={f.key} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <HugeIcon
                    name={f.icon}
                    size={18}
                    className="text-primary"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {tBranding(f.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-4 lg:w-1/2">
        {/* Mobile-only logo */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2.5 lg:hidden"
        >
          <Logo size={15} />
          <span className="font-heading text-xl font-bold">
            {tApp("name")}
          </span>
        </Link>

        <div ref={formRef} className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/auth/layout.tsx messages/en/auth.json messages/de/auth.json
git commit -m "feat: redesign auth pages with split-screen layout and branding"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no remaining scroll-reveal imports**

```bash
grep -r "scroll-reveal\|ScrollReveal" src/ --include="*.tsx" --include="*.ts"
```

Expected: No results.

- [ ] **Step 3: Verify all new translation keys exist in both locales**

```bash
grep -c "product\|resources\|legal" messages/en/landing.json
grep -c "product\|resources\|legal" messages/de/landing.json
grep -c "branding" messages/en/auth.json
grep -c "branding" messages/de/auth.json
```

Expected: Counts > 0 for all four files.

- [ ] **Step 4: Start dev server and manually verify pages**

```bash
npm run dev
```

Visit these routes and verify:
- `/en` — Landing page with all sections, GSAP animations
- `/en/blog` — Blog listing with staggered cards
- `/en/auth/login` — Split-screen layout
- `/en/auth/signup` — Split-screen layout

- [ ] **Step 5: Commit any final fixes if needed, then final commit**

```bash
git add -A
git status
```

If clean, no commit needed. If there are fixes:

```bash
git commit -m "fix: final adjustments from visual verification"
```
