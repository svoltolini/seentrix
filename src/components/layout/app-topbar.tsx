"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
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
import { NotificationsMenu } from "./notifications-menu";

/**
 * AppTopbar — slim 80 px top bar (Linear/Notion density). Three-column
 * grid so the search bar sits dead-centre regardless of left-side title
 * length or right-side action width.
 *
 *   left:    mobile sidebar trigger + page title (driven by pathname)
 *   centre:  search box (320 px max) — placeholder action for now
 *   right:   "+ New Product" dark CTA, notification bell, avatar
 *            (avatar is the dropdown trigger; the user's name + email
 *            were moved INSIDE the dropdown so the bar stays compact —
 *            on a 1280-1440 px viewport the full name+email cluster
 *            otherwise ate ~250 px of horizontal real estate).
 *
 * The 44-48 px inner controls (avatar, bell, CTA) sit comfortably
 * inside the 80 px bar with ~16 px breathing room top/bottom.
 */

type AppTopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  orgName?: string | null;
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

export function AppTopbar({ user, orgName }: AppTopbarProps) {
  const t = useTranslations();
  const title = usePageTitle();

  const initials = (user?.name ?? user?.email ?? "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .filter(Boolean)
    .join("");

  const accountLabel = t("nav.myAccount") ?? "Account";

  return (
    <header className="grid h-20 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b-[1.5px] border-border bg-card px-4 lg:px-8">
      {/* LEFT — mobile sidebar trigger + page title */}
      <div className="flex shrink-0 items-center gap-3">
        <MobileSidebarTrigger user={user} orgName={orgName} />
        <h1 className="hidden truncate text-h2 text-foreground md:block">
          {title}
        </h1>
      </div>

      {/* CENTRE — search. Hidden on small viewports; truly centred at md+
          because the column is `1fr` and the search has `max-w` capped
          plus `justify-center` on the wrapper. */}
      <div className="hidden justify-center md:flex">
        <SearchInput
          placeholder={t("topbar.searchPlaceholder") ?? "Search products, incidents, reports…"}
          aria-label={t("topbar.searchPlaceholder") ?? "Search"}
          className="w-full max-w-[480px]"
        />
      </div>

      {/* RIGHT — actions */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Primary CTA — dark navy "+ New Product". Opens the global
            side sheet (mounted in `app/layout.tsx`) via `?new=product`
            on the current path. The legacy /app/products/new route
            still works for direct links but the sheet is the primary
            UX now. Preserve any other query params currently on the
            URL so e.g. dashboard filter state doesn't get nuked when
            the user pops the sheet open. */}
        <NewProductButton label={t("topbar.newProduct") ?? "New Product"} />

        {/* Notification bell — `NotificationsMenu` owns the bell + the
            popover that opens on click. Lazily fetches the last 10
            activity rows via `getRecentNotifications` and tracks
            "unread" against a localStorage timestamp so the badge
            clears when the user opens the menu. */}
        <NotificationsMenu />

        {/* Profile dropdown — just the avatar as the trigger. Name
            (no email per user request) shows inside the dropdown.

            Geometry: the trigger button is explicitly `size-[42px]` so
            it can't collapse to zero height regardless of inherited
            line-height or `<button>`'s default inline display. The
            Avatar inside has `size-full` so the picture (when
            available) fills the entire 42 px circle. If
            `user.avatarUrl` is null, the AvatarFallback shows the
            user's initials instead — fix the data, not the markup
            (verify your `users.avatar_url` column is populated, or
            upload a photo via Settings → Account). */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={accountLabel}
              />
            }
          >
            <Avatar size="lg" className="size-full">
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt={user?.name ?? "User"}
              />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[240px]">
            {/* Identity header — avatar + name only. Email dropped
                per user request; if we need to surface it later it
                lives one click away on the Account screen. */}
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

            {/* Surface a one-click path to upload a photo when the
                user hasn't set one. Once `avatarUrl` is populated this
                row hides itself. */}
            {!user?.avatarUrl && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href="/app/settings/account" />}>
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

            <DropdownMenuItem render={<a href="/app/settings/account" />}>
              <Icon name="Setting2" size={16} />
              {accountLabel}
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

/**
 * Build a href that preserves the current pathname + query params and
 * sets `new=product` so the global `<CreateProductSheet />` opens.
 * Hoisted so other affordances (welcome page, sidebar, etc.) can lift
 * the same hook later without rewriting URL plumbing.
 */
export function useNewProductHref(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.set("new", "product");
  return `${pathname}?${params.toString()}`;
}

function NewProductButton({ label }: { label: string }) {
  const href = useNewProductHref();
  return (
    <Button
      variant="dark"
      size="default"
      render={<a href={href} />}
      className="hidden lg:inline-flex"
    >
      <Icon name="Add" size={20} />
      {label}
    </Button>
  );
}
