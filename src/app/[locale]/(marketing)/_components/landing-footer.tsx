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
          {/* Brand — logo + wordmark on the first row, then the company
              info stacked underneath and indented to sit flush with the
              start of the 'Seentrix' wordmark (logo size-15 + gap-2 = 23px,
              rounded to the pl-6 scale). Splitting the legal string over
              two lines avoids orphaning '17169165' on its own line when
              the column wraps on narrower viewports. Logo inverted with
              brightness-0 invert because the SVG ships with fill #020A0F
              (near-black) which is invisible on the dark footer. */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Logo size={18} className="shrink-0" />
              <span className="text-base font-bold tracking-tight">
                Seentrix
              </span>
            </div>
            <div className="flex flex-col gap-0.5 pl-6 text-sm text-muted-foreground">
              <span>Seentrix Ltd</span>
              <span>Companies House 17169165</span>
              <span className="mt-2 leading-relaxed">
                167-169 Great Portland Street
                <br />
                London W1W 5PF
                <br />
                United Kingdom
              </span>
            </div>
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
              <Link
                href="/legal/impressum"
                className="transition-colors hover:text-foreground"
              >
                {t("impressum")}
              </Link>
              <Link
                href="/legal/privacy"
                className="transition-colors hover:text-foreground"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/legal/terms"
                className="transition-colors hover:text-foreground"
              >
                {t("terms")}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            {t("copyright", { year: String(year) })}
          </span>
        </div>
      </div>
    </footer>
  );
}
