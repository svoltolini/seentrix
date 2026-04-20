"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Landing-page teaser for the AI Copilot feature.
 *
 * Intentionally punchy — the full story (privacy, retention, quota) lives
 * on /ai. This section exists to stop a scroll with the "only CRA copilot
 * that doesn't send your data to a US AI company" line, then send the
 * reader onwards.
 */
export function CopilotSection() {
  const t = useTranslations("copilot.marketing");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const items = el.querySelectorAll("[data-copilot-anim]");
    gsap.set(items, { opacity: 0, y: 24 });

    const ctx = gsap.context(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 80%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const bullets = ["sovereign", "grounded", "context", "actionable"] as const;

  return (
    <section ref={sectionRef} className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0B0B12] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 15%, rgba(94,234,212,0.12) 0%, transparent 45%), radial-gradient(ellipse at 90% 20%, rgba(236,72,153,0.14) 0%, transparent 45%), radial-gradient(ellipse at 95% 80%, rgba(249,115,22,0.10) 0%, transparent 50%)",
          }}
        >
          <div className="max-w-3xl">
            <span
              data-copilot-anim
              className="inline-flex items-center gap-2 rounded-full bg-[#60A5FA]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93C5FD] ring-1 ring-[#60A5FA]/20"
            >
              {t("eyebrow")}
            </span>
            <h2
              data-copilot-anim
              className="mt-6 font-heading text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[44px]"
            >
              {t("title")}
            </h2>
            <p
              data-copilot-anim
              className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {t("lede")}
            </p>
          </div>

          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            {bullets.map((key) => (
              <div
                key={key}
                data-copilot-anim
                className="flex flex-col gap-1 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.06]"
              >
                <dt className="font-heading text-base font-semibold text-white">
                  {t(`bullets.${key}.title`)}
                </dt>
                <dd className="text-sm leading-relaxed text-white/60">
                  {t(`bullets.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>

          <div
            data-copilot-anim
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link href="/ai">
              <Button size="lg" variant="ghost" className="text-white">
                {t("learnMore")}
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg">{t("ctaPrimary")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
