"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Icon } from "@/components/icon";
import { useCopilot } from "@/components/copilot/copilot-context";

/**
 * AppSidebar — Nask vertical sidebar.
 * Geometry per Figma frames `57:28136` and `85:10566`:
 *   width 310, white surface, right border 1.5px on `--border`
 *   Inside: workspace card (top, 71h), nav menu (52h items @ gap-2.5),
 *   utility group (separated by gap-12), Help Centre banner (bottom)
 *
 * Active state: `bg-primary text-primary-foreground rounded-md`. Icons in
 * Bold variant when active, Linear when inactive (matches the Vuesax
 * convention used in the Figma file).
 */

const NAV_PRIMARY = [
  { href: "/app/dashboard",             labelKey: "nav.dashboard", icon: "Category" as const },
  { href: "/app/products",              labelKey: "nav.products",  icon: "FolderMinus" as const },
  { href: "/app/incidents",             labelKey: "nav.incidents", icon: "Warning2" as const },
  { href: "/app/vulnerability-reports", labelKey: "nav.reports",   icon: "ShieldTick" as const },
  { href: "/app/academy",               labelKey: "nav.academy",   icon: "Teacher" as const },
  { href: "/app/settings",              labelKey: "nav.settings",  icon: "Setting2" as const },
];

type AppSidebarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  orgName?: string | null;
  className?: string;
};

export function AppSidebar({ user, orgName, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen w-[310px] shrink-0 flex-col border-r-[1.5px] border-border bg-sidebar lg:flex",
        className,
      )}
    >
      <SidebarBody user={user} orgName={orgName} />
    </aside>
  );
}

/**
 * MobileSidebarTrigger — hamburger that opens the same sidebar in a Sheet on
 * < lg viewports. Mounted in `AppTopbar`.
 */
export function MobileSidebarTrigger({
  user,
  orgName,
}: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Icon name="HambergerMenu" size={20} />
      </Button>
      <SheetContent side="left" className="w-[310px] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarBody
          user={user}
          orgName={orgName}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function SidebarBody({
  user,
  orgName,
  onNavigate,
}: AppSidebarProps & { onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const copilot = useCopilot();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = (orgName ?? user?.name ?? "S")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-full flex-col px-6 pt-5 pb-[30px]">
      {/* Workspace switcher card */}
      <div className="flex h-[71px] w-full items-center gap-3.5 rounded-md border-[1.5px] border-border p-3">
        <Avatar size="lg">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={orgName ?? "Workspace"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-1 truncate">
          <p className="truncate text-h5 text-foreground">
            {orgName ?? t("app.name")}
          </p>
          <p className="text-p3 text-muted-foreground">{t("sidebar.overview")}</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="mt-12 flex flex-col gap-2.5">
        {NAV_PRIMARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-[52px] w-full items-center gap-3.5 rounded-md px-3.5 text-l5 transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                name={item.icon}
                size={24}
                variant={active ? "Bold" : "Linear"}
              />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Help Centre banner — pushed to bottom */}
      <div className="mt-auto pt-6">
        <HelpCentreBanner onConsult={() => { copilot.open(); onNavigate?.(); }} />
      </div>
    </div>
  );
}

/**
 * HelpCentreBanner — Figma `97:12846` group. Dark navy panel with a floating
 * 56px illustration overlapping the top edge, "Help Centre" title, body copy,
 * and a primary-blue CTA. The CTA wires into Seentrix's AI Copilot since that
 * is functionally equivalent to "Consult Now".
 */
function HelpCentreBanner({ onConsult }: { onConsult: () => void }) {
  const t = useTranslations();
  return (
    <div className="relative w-full">
      {/* Floating icon — circular orange chip with question mark, overlaps top */}
      <div className="absolute left-1/2 top-0 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-card-md">
        <Icon name="MessageQuestion" size={28} variant="Bold" />
      </div>

      <div className="rounded-md bg-dark-cta px-4 pb-3.5 pt-9 text-center">
        <h3 className="text-h4 text-white">{t("sidebar.helpTitle") ?? "Help Centre"}</h3>
        <p className="mt-2 text-p3-r text-muted-foreground">
          {t("sidebar.helpBody") ?? "Stuck on CRA compliance? Ask the Seentrix AI Copilot."}
        </p>
        <Button
          variant="default"
          className="mt-4 w-full"
          onClick={onConsult}
        >
          <Icon name="MagicStar" size={16} variant="Bold" />
          {t("sidebar.helpCta") ?? "Consult Now"}
        </Button>
      </div>
    </div>
  );
}
