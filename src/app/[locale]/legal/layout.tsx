import { Link } from "@/i18n/navigation";

/**
 * Shared shell for every legal document: a narrow reading column with a
 * consistent header band above. The per-page content carries its own
 * "Last updated" line at the top.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Seentrix
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/legal/impressum"
              className="transition-colors hover:text-foreground"
            >
              Impressum
            </Link>
            <Link
              href="/legal/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/legal/dpa"
              className="transition-colors hover:text-foreground"
            >
              DPA
            </Link>
            <Link
              href="/legal/cookies"
              className="transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <article className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:my-1">
          {children}
        </article>
      </main>
    </div>
  );
}
