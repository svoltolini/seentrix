"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";

/**
 * Nask auth shell — light gray page background, brand mark above a white
 * card that holds the form. The card uses the smaller `card-md` shadow so it
 * sits comfortably on the gray bg without feeling lifted.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: "power2.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div ref={containerRef} className="w-full max-w-[380px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
        >
          <Logo size={26} className="shrink-0 text-primary" />
          <span className="font-heading text-[21px] font-semibold tracking-[-0.3px] text-foreground">
            Seentrix
          </span>
        </Link>
        {/* No card — the form sits directly on the warm background (Clay
            centered login). */}
        {children}
      </div>
    </div>
  );
}
