import { Link } from "@/i18n/navigation";

/**
 * Shared shell for every legal document: a narrow reading column with a
 * consistent header band and a "template — needs lawyer review" disclaimer
 * pinned at the top so it's impossible to ship to production without
 * noticing it.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Seentrix
          </Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
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
        <div className="mb-6 rounded-xl border border-[#D97706]/30 bg-[#D97706]/[0.08] p-4 text-[13px] text-[#D97706]">
          <strong>Template.</strong> This document is a starting draft that
          must be reviewed by a qualified lawyer before Seentrix is marketed
          publicly. Replace every <code>{"{placeholder}"}</code> with the
          correct value and remove this banner.
        </div>
        <article className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:my-1">
          {children}
        </article>
      </main>
    </div>
  );
}
