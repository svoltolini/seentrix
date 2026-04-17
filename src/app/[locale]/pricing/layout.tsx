import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Link href="/app/dashboard" className="flex items-center gap-2.5">
          <Logo size={13} />
          <span className="text-lg font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/app/dashboard">
            <Button variant="ghost" size="sm">
              {t("nav.dashboard")}
            </Button>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
