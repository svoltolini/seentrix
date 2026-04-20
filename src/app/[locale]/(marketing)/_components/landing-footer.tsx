import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const tHeader = useTranslations("landing.header");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Logo size={15} className="shrink-0" />
              <span className="text-base font-bold tracking-tight">
                Seentrix
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {t("location")}
            </span>
            <span className="text-xs text-muted-foreground/60">
              Seentrix Ltd · Company no. 17169165 · Registered in England
              and Wales
            </span>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("product")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#features" className="transition-colors hover:text-foreground">
                {tHeader("features")}
              </a>
              <a href="#pricing" className="transition-colors hover:text-foreground">
                {tHeader("pricing")}
              </a>
              <a href="#timeline" className="transition-colors hover:text-foreground">
                {tHeader("timeline")}
              </a>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("resources")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/blog" className="transition-colors hover:text-foreground">
                {tHeader("blog")}
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-foreground">
              {t("legal")}
            </span>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>{t("impressum")}</span>
              <span>{t("privacy")}</span>
              <span>{t("terms")}</span>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <span className="text-sm text-muted-foreground/60">
            {t("copyright", { year: String(year) })}
          </span>
        </div>
      </div>
    </footer>
  );
}
