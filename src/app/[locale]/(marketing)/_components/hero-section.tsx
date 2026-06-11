"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { CountdownTimer } from "./countdown-timer";
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
      {/* Soft dot grid pattern (light mode — navy dots at 4% alpha) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(44,54,89,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* No atmospheric gradient blobs — Nask is a flat design system. The
          dot grid above is enough background texture; gradients here brought
          off-palette purple in and clutter the hero. */}

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        {/* Clay pill — accent-soft capsule (design `.mk-pill`) */}
        <span
          data-hero-reveal
          className="rounded-full bg-accent-soft px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-primary"
        >
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

        {/* Scroll indicator — decorative, hidden from SRs. */}
        <div data-hero-reveal className="mt-6 animate-bounce">
          <Icon
            name="ArrowDown2"
            size={24}
            aria-hidden="true"
            className="text-muted-foreground"
          />
        </div>
      </div>
    </section>
  );
}
