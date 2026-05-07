"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
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
import Image from "next/image";

const anchors = [
  { href: "#features", key: "features" },
  { href: "#pricing", key: "pricing" },
  { href: "#timeline", key: "timeline" },
] as const;

const pageLinks = [
  { href: "/blog", key: "blog" },
] as const;

export function LandingHeader({ isAuthed = false }: { isAuthed?: boolean }) {
  const t = useTranslations("landing.header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

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
        "sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-shadow",
        scrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo size={20} className="shrink-0" />
          <span className="text-h4 text-foreground">Seentrix</span>
        </Link>

        {/* Center: Nav (desktop) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {anchors.map((a) => (
            <button
              key={a.key}
              onClick={() => scrollTo(a.href)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(a.key)}
            </button>
          ))}
          {pageLinks.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(p.key)}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchLocale("en")}
              className={cn(
                "flex items-center rounded-lg p-1.5 transition-opacity",
                locale === "en" ? "opacity-100" : "opacity-40 hover:opacity-70"
              )}
              aria-label="English"
            >
              <Image
                src="/flags/united-kingdom.png"
                alt="English"
                width={22}
                height={22}
                className="shrink-0 rounded-full"
              />
            </button>
            <button
              onClick={() => switchLocale("de")}
              className={cn(
                "relative flex h-[22px] w-[38px] items-center rounded-lg p-1.5 transition-opacity",
                locale === "de" ? "opacity-100" : "opacity-40 hover:opacity-70"
              )}
              aria-label="Deutsch"
            >
              <div className="absolute left-[18px] top-1/2 -translate-y-1/2">
                <Image
                  src="/flags/germany.png"
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0 rounded-full ring-2 ring-background"
                />
              </div>
              <div className="absolute left-[11px] top-1/2 -translate-y-1/2">
                <Image
                  src="/flags/austria.png"
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0 rounded-full ring-2 ring-background"
                />
              </div>
              <div className="absolute left-[4px] top-1/2 z-10 -translate-y-1/2">
                <Image
                  src="/flags/switzerland.png"
                  alt=""
                  width={20}
                  height={20}
                  className="shrink-0 rounded-full ring-2 ring-background"
                />
              </div>
            </button>
          </div>

          {/* Desktop auth buttons — swap in 'Dashboard' if the visitor is
              already signed in. Keeps the header honest: logged-in users
              were previously shown 'Log in' and had to click it to find
              out they were already authed, which is dissonant. */}
          <div className="hidden items-center gap-2 lg:flex">
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
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {t("login")}
              </Link>
            )}
          </div>

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
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(a.key)}
                  </button>
                ))}
                {pageLinks.map((p) => (
                  <Link
                    key={p.key}
                    href={p.href}
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(p.key)}
                  </Link>
                ))}
                <hr className="my-2 border-border" />
                {isAuthed ? (
                  <Link
                    href="/app/dashboard"
                    className="flex items-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors"
                  >
                    {t("dashboard")}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
