"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { CountdownTimer } from "./countdown-timer";
import { Logo } from "@/components/logo";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
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
  }, [reduced]);

  function scrollToPricing() {
    document
      .getElementById("pricing")
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden px-6 pt-20 pb-28 lg:pt-28 lg:pb-36"
    >
      {/* Soft dot grid pattern — warm ink dots on the Clay background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(43,42,38,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        {/* Clay pill — accent-soft capsule w/ shield (design `.mk-pill`) */}
        <span
          data-hero-reveal
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-primary"
        >
          <Icon name="shield-check" size={14} />
          {t("badge")}
        </span>

        {/* Clay hero headline — 60/500 serif, accent em (design `.mk-hero h1`) */}
        <h1
          data-hero-reveal
          className="font-heading text-[40px] font-medium leading-[1.08] tracking-[-1.5px] text-balance sm:text-[52px] lg:text-[60px]"
        >
          <span className="text-foreground">{t("titleLine1")}</span>
          <br />
          <em className="not-italic text-primary">{t("titleLine2")}</em>
        </h1>

        <p
          data-hero-reveal
          className="max-w-[56ch] text-[18px] leading-relaxed text-muted-foreground"
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
          <p className="mb-4 text-p3 text-muted-foreground">
            {t("countdown.title")}
          </p>
          <CountdownTimer />
        </div>

        {/* Product preview — faux browser frame with a hand-built miniature
            dashboard (design `.mk-preview`). Decorative: a CSS "screenshot"
            substitute, hidden from screen readers. Bleeds off the bottom. */}
        <div
          data-hero-reveal
          aria-hidden="true"
          className="mt-10 w-full max-w-4xl overflow-hidden rounded-t-2xl border border-b-0 border-border-strong bg-card text-left shadow-[0_16px_48px_rgba(60,40,20,0.10)]"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#e2ddd1]" />
            <span className="size-2.5 rounded-full bg-[#e2ddd1]" />
            <span className="size-2.5 rounded-full bg-[#e2ddd1]" />
          </div>
          {/* Mini nav */}
          <div className="flex items-center gap-4 border-b border-border bg-background px-5 py-2.5">
            <span className="flex items-center gap-1.5 font-heading text-[13px] font-semibold text-foreground">
              <Logo size={13} className="text-primary" />
              Seentrix
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1 text-[10.5px] font-semibold text-foreground shadow-card-sm">
              Dashboard
            </span>
            <span className="px-1 text-[10.5px] font-medium text-muted-foreground">
              Products
            </span>
            <span className="px-1 text-[10.5px] font-medium text-muted-foreground">
              Incidents
            </span>
            <span className="px-1 text-[10.5px] font-medium text-muted-foreground">
              Reports
            </span>
            <span className="ml-auto size-5 rounded-md bg-primary" />
          </div>
          {/* Mini hero + stats — mirrors the real dashboard: eyebrow + serif
              greeting on the left, the signature compliance ring on the
              right, then the 4-up stat row. */}
          <div className="bg-background px-5 pb-0 pt-4">
            <div className="rounded-t-xl border border-b-0 border-border bg-card px-5 pb-5 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[1px] text-primary">
                    CRA readiness · Northwind
                  </p>
                  <p className="mt-1.5 font-heading text-[17px] font-medium leading-tight tracking-[-0.3px] text-foreground">
                    Good morning, Sofia.
                    <br />
                    You&apos;re <em className="not-italic text-primary">68%</em>{" "}
                    of the way to conformity.
                  </p>
                </div>
                <PreviewRing value={68} />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2.5">
                {[
                  ["12", "Products"],
                  ["84%", "SBOM coverage"],
                  ["7", "Open vulns"],
                  ["3", "Overdue"],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="rounded-lg border border-border px-3 py-2.5"
                  >
                    <p className="font-heading text-[18px] font-semibold tracking-[-0.4px] text-foreground">
                      {v}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small static compliance ring for the hero's dashboard preview. */
function PreviewRing({ value }: { value: number }) {
  const size = 74;
  const thickness = 8;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-3)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[18px] font-semibold text-foreground">
        {value}
        <span className="text-[10px] text-muted-foreground">%</span>
      </span>
    </div>
  );
}
