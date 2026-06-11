"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";

const anchors = [
  { href: "#features", key: "features" },
  { href: "#pricing", key: "pricing" },
  { href: "#timeline", key: "timeline" },
] as const;

const pageLinks = [
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

export function LandingHeader({ isAuthed = false }: { isAuthed?: boolean }) {
  const t = useTranslations("landing.header");
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/${id}`);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-transparent bg-background transition-[border]",
        scrolled && "border-border",
      )}
    >
      {/* Clay top bar (design `.mk-top`): logo left, links + Sign-in pushed
          right; 72px tall on a warm background. */}
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-6 sm:px-10">
        {/* Logo — serif wordmark */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo size={22} className="shrink-0 text-primary" />
          <span className="font-heading text-[21px] font-semibold tracking-[-0.3px] text-foreground">
            Seentrix
          </span>
        </Link>

        {/* Right cluster: nav links + Sign in */}
        <div className="ml-auto hidden items-center gap-7 lg:flex">
          <nav className="flex items-center gap-6">
            {anchors.map((a) => (
              <button
                key={a.key}
                onClick={() => scrollTo(a.href)}
                className="cursor-pointer text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(a.key)}
              </button>
            ))}
            {pageLinks.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(p.key)}
              </Link>
            ))}
          </nav>
          {isAuthed ? (
            <Link
              href="/app/dashboard"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              {t("dashboard")}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* Mobile cluster */}
        <div className="ml-auto flex items-center gap-2 lg:hidden">

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Icon name="menu-02" size={20} />
                  <span className="sr-only">{t("menu")}</span>
                </Button>
              }
            />
            <SheetContent side="top" className="p-0">
              <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
              <nav className="flex flex-col gap-1 p-4">
                {anchors.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => scrollTo(a.href)}
                    className="flex items-center rounded-sm px-3 py-2.5 text-l6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(a.key)}
                  </button>
                ))}
                {pageLinks.map((p) => (
                  <Link
                    key={p.key}
                    href={p.href}
                    className="flex items-center rounded-sm px-3 py-2.5 text-l6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(p.key)}
                  </Link>
                ))}
                <hr className="my-2 border-border" />
                {isAuthed ? (
                  <Link
                    href="/app/dashboard"
                    className="flex items-center rounded-sm bg-primary px-3 py-2.5 text-l5 text-primary-foreground transition-colors"
                  >
                    {t("dashboard")}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center rounded-sm px-3 py-2.5 text-l6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("login")}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
