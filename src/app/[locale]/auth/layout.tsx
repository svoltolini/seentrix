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
