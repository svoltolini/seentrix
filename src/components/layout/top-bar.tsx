"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { HugeIcon } from "@/components/huge-icon";
import Image from "next/image";
import { logout } from "@/app/[locale]/auth/actions";

const navItems = [
  {
    href: "/app/dashboard",
    labelKey: "nav.dashboard",
    icon: "package",
  },
  {
    href: "/app/products",
    labelKey: "nav.products",
    icon: "package-open-stroke-rounded",
  },
  {
    href: "/app/settings",
    labelKey: "nav.settings",
    icon: "settings-02",
  },
];

export function TopBar({ avatarUrl }: { avatarUrl?: string | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          {t("app.name")}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HugeIcon name={item.icon} size={16} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Language switcher + User + Mobile menu */}
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

        {/* Divider */}
        <div className="hidden h-5 w-px bg-border lg:block" />

        {/* User avatar + Logout */}
        <div className="hidden items-center gap-2 lg:flex">
          {avatarUrl && (
            <div className="size-7 overflow-hidden rounded-full">
              <Image
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-full object-cover"
              />
            </div>
          )}
          <button
            onClick={() => logout(locale)}
            className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            {t("nav.logout")}
          </button>
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden">
                <HugeIcon name="menu-02" size={20} />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            }
          />
          <SheetContent side="top" className="p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HugeIcon name={item.icon} size={16} />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => logout(locale)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <HugeIcon name="lock-password-stroke-rounded" size={16} />
                {t("nav.logout")}
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
