"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon, type IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Match this exact path only (for the overview root). */
  exact?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "Chart", exact: true },
  { href: "/admin/revenue", label: "Revenue", icon: "DollarCircle" },
  { href: "/admin/companies", label: "Companies", icon: "Building" },
  { href: "/admin/usage", label: "Usage & AI", icon: "Flash" },
  { href: "/admin/issues", label: "Issues", icon: "Warning2" },
  { href: "/admin/copilot", label: "Copilot", icon: "MessageQuestion" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-l6 transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name={item.icon} size={15} variant={active ? "Bold" : "Linear"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
