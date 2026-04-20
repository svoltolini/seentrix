"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";

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
      <div ref={containerRef} className="w-full max-w-[340px]">
        {/* Logo + wordmark link to landing. brightness-0 invert flips
            the SVG's near-black fill (#020A0F) to white so it's visible
            on the dark background — same pattern as the landing footer.
            Previously only the (invisible) logo was the back-to-landing
            affordance, so users landing on auth felt stuck. */}
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
        >
          <Logo size={28} className="shrink-0 brightness-0 invert" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Seentrix
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
