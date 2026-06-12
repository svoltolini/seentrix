"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";

import { useCreateProduct } from "@/components/products/create-product-context";
import { TopbarSearch } from "./topbar-search";
import { LanguagePicker } from "@/components/language-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/icon";
import { Logo } from "@/components/logo";
import { logout } from "@/app/[locale]/auth/actions";
import { NotificationsMenu } from "./notifications-menu";
import { cn } from "@/lib/utils";

/**
 * AppTopnav — the Clay app shell (design handoff "App Shell & Routing").
 *
 * One sticky 64px bar on the page background with a bottom hairline:
 *   left:   logo mark + "Seentrix" wordmark (serif 21/600) → dashboard
 *   center: nav tabs (14/500; active = white surface + ink text). Hidden
 *           below lg, where a menu button exposes the same destinations.
 *   right:  + New product, a wider search box, language, bell, then the
 *           round avatar dropdown (account / help / logout). Copilot lives
 *           in the floating FAB + ⌘K, not the bar.
 *
 * Replaces the old sidebar + slim-topbar shell entirely.
 */

const NAV_ITEMS: { href: string; labelKey: string; icon: IconName }[] = [
  { href: "/app/dashboard",             labelKey: "nav.dashboard", icon: "Category" },
  { href: "/app/products",              labelKey: "nav.products",  icon: "FolderMinus" },
  { href: "/app/incidents",             labelKey: "nav.incidents", icon: "Warning2" },
  { href: "/app/vulnerability-reports", labelKey: "nav.reports",   icon: "ShieldTick" },
  { href: "/app/academy",               labelKey: "nav.academy",   icon: "Teacher" },
  { href: "/app/settings",              labelKey: "nav.settings",  icon: "Setting2" },
];

type AppTopnavProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  orgName?: string | null;
};

export function AppTopnav({ user, orgName }: AppTopnavProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { open: openCreateProduct } = useCreateProduct();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = (user?.name ?? user?.email ?? "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join("");

  const accountLabel = t("nav.myAccount") ?? "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-16 items-center gap-5 px-4 sm:px-[30px]">
        {/* Mobile nav menu — same destinations as the tabs */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                aria-label={t("nav.dashboard")}
              />
            }
          >
            <Icon name="HambergerMenu" size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href} />}
              >
                <Icon name={item.icon} size={16} />
                {t(item.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logo — serif wordmark, links home */}
        <Link
          href="/app/dashboard"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={orgName ?? t("app.name")}
        >
          <Logo size={22} className="shrink-0 text-primary" />
          <span className="hidden font-heading text-[21px] font-semibold tracking-[-0.3px] text-foreground sm:block">
            {t("app.name")}
          </span>
        </Link>

        {/* Tabs */}
        <nav className="ml-5 hidden items-center gap-1.5 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-4 py-2 text-[14px] transition-colors",
                  active
                    ? "bg-card font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/* + New product — height-matched to the search box (h-12) so the
              right cluster reads as one row */}
          <Button
            onClick={openCreateProduct}
            className="mr-1 hidden h-12 rounded-md md:inline-flex"
          >
            <Icon name="Add" size={15} />
            {t("topbar.newProduct") ?? "New Product"}
          </Button>

          {/* Quick search — Copilot lives in the floating FAB + ⌘K, so the
              top bar gives that space to a wider search box. */}
          <div className="hidden lg:block">
            <TopbarSearch className="w-[300px]" />
          </div>

          <LanguagePicker variant="menu" align="end" />
          <NotificationsMenu />

          {/* Avatar dropdown — round green avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="ml-1 inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={accountLabel}
                />
              }
            >
              <Avatar size="lg" className="size-full rounded-full">
                <AvatarImage
                  src={user?.avatarUrl ?? undefined}
                  alt={user?.name ?? "User"}
                />
                <AvatarFallback className="rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar size="default">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <p className="truncate text-h5 text-foreground">
                  {user?.name ?? "User"}
                </p>
              </div>

              {!user?.avatarUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/app/settings/account" />}>
                    <Icon name="Camera" size={16} className="text-primary" />
                    <span className="text-primary">
                      {t.has("topbar.addProfilePicture")
                        ? t("topbar.addProfilePicture")
                        : "Add a profile picture"}
                    </span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem render={<Link href="/app/settings/account" />}>
                <Icon name="Setting2" size={16} />
                {accountLabel}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/app/help/glossary" />}>
                <Icon name="MessageQuestion" size={16} />
                {t("nav.help") ?? "Help"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                <Icon name="LogoutCurve" size={16} />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
