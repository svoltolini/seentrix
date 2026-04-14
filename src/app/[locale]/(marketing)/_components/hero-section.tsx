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
