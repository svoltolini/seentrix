"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/icon";
import { logout } from "@/app/[locale]/auth/actions";
import { MobileSidebarTrigger } from "./app-sidebar";

/**
 * AppTopbar — Nask slim 110px top bar (frame `57:26339`).
 *   left:    page title (driven by pathname) + mobile hamburger
 *   center:  search box (333×48 filled) — placeholder action for now
 *   right:   "+ New Product" dark CTA, notification bell, profile cluster
 */

type AppTopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  orgName?: string | null;
  hasUnread?: boolean;
};

const TITLE_MAP: { match: (path: string) => boolean; key: string }[] = [
  { match: (p) => p.includes("/app/dashboard"),             key: "nav.dashboard" },
  { match: (p) => p.includes("/app/products/new"),          key: "products.new.title" },
  { match: (p) => p.includes("/app/products"),              key: "nav.products" },
  { match: (p) => p.includes("/app/incidents"),             key: "nav.incidents" },
  { match: (p) => p.includes("/app/vulnerability-reports"), key: "nav.reports" },
  { match: (p) => p.includes("/app/academy"),               key: "nav.academy" },
  { match: (p) => p.includes("/app/help"),                  key: "nav.help" },
  { match: (p) => p.includes("/app/settings"),              key: "nav.settings" },
  { match: (p) => p.includes("/app/welcome"),               key: "nav.dashboard" },
];

function usePageTitle() {
  const pathname = usePathname();
  const t = useTranslations();
  const match = TITLE_MAP.find((entry) => entry.match(pathname));
  // Fall back to a plain `Seentrix` if pathname matches nothing in the map.
  try {
    return match ? t(match.key) : t("app.name");
  } catch {
    return t("app.name");
  }
}

export function AppTopbar({ user, orgName, hasUnread }: AppTopbarProps) {
  const t = useTranslations();
  const title = usePageTitle();

  const initials = (user?.name ?? user?.email ?? "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join("");

  return (
    <header className="flex h-[110px] shrink-0 items-center gap-4 border-b-[1.5px] border-border bg-card px-4 lg:px-8">
      {/* Mobile sidebar trigger + title */}
      <div className="flex shrink-0 items-center gap-3">
        <MobileSidebarTrigger user={user} orgName={orgName} />
        <h1 className="hidden truncate text-h2 text-foreground md:block">{title}</h1>
      </div>

      {/* Search */}
      <div className="ml-auto hidden w-full max-w-[420px] md:block">
        <SearchInput
          placeholder={t("topbar.searchPlaceholder") ?? "Search products, incidents, reports…"}
          aria-label={t("topbar.searchPlaceholder") ?? "Search"}
        />
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0">
        {/* Primary CTA — dark navy "+ New Product" */}
        <Button
          variant="dark"
          size="default"
          render={<a href="/app/products/new" />}
          className="hidden lg:inline-flex"
        >
          <Icon name="Add" size={20} />
          {t("topbar.newProduct") ?? "New Product"}
        </Button>

        {/* Notification bell — round 44px, with red unread dot */}
        <button
          type="button"
          aria-label={t("topbar.notifications") ?? "Notifications"}
          className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-card text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="Notification" size={22} />
          {hasUnread && (
            <span className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </button>

        {/* Profile cluster + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-3.5 rounded-md px-2 py-1 transition-colors hover:bg-muted"
                aria-label={t("nav.myAccount") ?? "Account"}
              />
            }
          >
            <Avatar size="lg">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start gap-1 text-left lg:flex">
              <p className="text-h5 text-foreground">{user?.name ?? user?.email ?? "User"}</p>
              {user?.email && (
                <p className="max-w-[180px] truncate text-p3 text-muted-foreground">{user.email}</p>
              )}
            </div>
            <Icon name="ChevronDownIcon" size={20} className="hidden text-muted-foreground lg:inline-block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            <DropdownMenuItem render={<a href="/app/settings/account" />}>
              <Icon name="Setting2" size={16} />
              {t("nav.myAccount") ?? "Account"}
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href="/app/help/glossary" />}>
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
    </header>
  );
}
