import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Dedicated marketing layout for the Copilot landing page (/ai).
 * Same chrome as /pricing — thin branded header, subtle muted body.
 * Keeps the page scannable for procurement teams linked directly
 * from sales conversations.
 */
export default function AiLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={13} className="shrink-0 brightness-0 invert" />
          <span className="text-lg font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">{t("copilot.marketing.ctaPrimary")}</Button>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
