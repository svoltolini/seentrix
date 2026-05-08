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

        {/* Notification bell — `NotificationsMenu` owns the bell + the
            popover that opens on click. Lazily fetches the last 10
            activity rows via `getRecentNotifications` and tracks
            "unread" against a localStorage timestamp so the badge
            clears when the user opens the menu. */}
        <NotificationsMenu />

        {/* Profile dropdown — JUST the avatar as trigger. The user's
            name + email moved INTO the dropdown header below so the
            top bar stays compact (the inline cluster previously ate
            ~250 px of horizontal space at lg+).

            `inline-flex` on the trigger is critical — the default
            `display: inline` for `<button>` collapses the Avatar's
            42 px box on some browser/font combos and the picture
            vanishes from view. Items + justify-center keeps it
            visually centred inside the click target. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={accountLabel}
              />
            }
          >
            <Avatar size="lg">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[240px]">
            {/* Identity header — name + email at the top of the
                dropdown so we don't lose the info, just relocate it. */}
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar size="default">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-h5 text-foreground">
                  {user?.name ?? user?.email ?? "User"}
                </p>
                {user?.email && user.email !== user.name && (
                  <p className="truncate text-p4-r text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

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
