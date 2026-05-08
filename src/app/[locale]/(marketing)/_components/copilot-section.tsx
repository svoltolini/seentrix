"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Landing-page teaser for Seentrix AI.
 *
 * Styled to match ProblemSection — dark band wrapping, centred heading,
 * four borderless cells each anchored by a big gradient numeral. No
 * large bordered container; the section breathes inside the landing
 * page's own dark rhythm.
 */
export function CopilotSection() {
  const t = useTranslations("copilot.marketing");
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const heading = el.querySelectorAll("[data-copilot-heading]");
    const cells = el.querySelectorAll("[data-copilot-cell]");
    const cta = el.querySelectorAll("[data-copilot-cta]");
    gsap.set([...heading, ...cells, ...cta], { opacity: 0, y: 32 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 80%", once: true },
      });
      tl.to(heading, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
      tl.to(
        cells,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
        },
        "<0.15",
      );
      tl.to(cta, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "<0.3");
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  // Numerals alternate between solid primary blue and solid accent orange
  // so the row still reads as a sequence without leaning on off-palette
  // purple bridge tones. Flat, Nask-consistent.
  const bullets = [
    { key: "sovereign",  tone: "text-primary" },
    { key: "grounded",   tone: "text-accent"  },
    { key: "context",    tone: "text-primary" },
    { key: "actionable", tone: "text-accent"  },
  ] as const;

  return (
    <section
      ref={sectionRef}
      className="bg-background py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading block ----------------------------------------------- */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span
            data-copilot-heading
            className="text-l6-plus uppercase tracking-[0.18em] text-primary"
          >
            {t("eyebrow")}
          </span>
          <h2
            data-copilot-heading
            className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p
            data-copilot-heading
            className="mt-6 text-p1 text-muted-foreground"
          >
            {t("lede")}
          </p>
        </div>

        {/* Four borderless cells, each anchored by an 01/02/03/04 in solid
            primary/accent — flat Nask, no gradient text. */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {bullets.map(({ key, tone }, i) => (
            <div
              key={key}
              data-copilot-cell
              className="flex flex-col items-start text-left"
            >
              <span
                className={`${tone} text-6xl font-extrabold leading-none tracking-tight sm:text-7xl`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-h4 text-foreground">
                {t(`bullets.${key}.title`)}
              </h3>
              <p className="mt-3 text-p3 text-muted-foreground">
                {t(`bullets.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs -------------------------------------------------------- */}
        <div
          data-copilot-cta
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/ai">
            <Button size="lg" variant="outline">
              {t("learnMore")}
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg">{t("ctaPrimary")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
