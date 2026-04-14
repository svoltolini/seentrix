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
