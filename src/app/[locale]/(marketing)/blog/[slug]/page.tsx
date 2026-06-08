import { Icon } from "@/components/icon";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  getPostBySlug,
  getRelatedPosts,
  getAllSlugs,
  extractHeadings,
} from "@/lib/blog";
import { routing } from "@/i18n/routing";
import { mdxComponents } from "../_components/mdx-components";
import { TableOfContents } from "../_components/table-of-contents";
import { BlogCard } from "../_components/blog-card";
import type { Metadata } from "next";

export function generateStaticParams() {
  // Enumerate slugs against the default locale only. The active language is
  // negotiated at request time from the NEXT_LOCALE cookie (localePrefix:
  // "never"), so we don't pre-render a static page per locale — doing so would
  // pin each page to a build-time language and defeat cookie-based switching.
  return getAllSlugs().map((slug) => ({ locale: routing.defaultLocale, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getPostBySlug(locale, slug);
  if (!post) return {};

  const baseUrl = "https://seentrix.com";

  return {
    title: `${post.title} — Seentrix Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${baseUrl}/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      ...(post.ogImage && { images: [{ url: post.ogImage }] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const headings = extractHeadings(post.content);
  const related = getRelatedPosts(locale, slug, 2);

  // schema.org Article — gives Google a crawlable structured-data hint
  // for rich results (publish date, author, image). Inline JSON-LD is
  // the recommended pattern for static MDX-backed posts; nothing in the
  // payload changes after build, so embedding it in the document beats
  // shipping a separate endpoint.
  const baseUrl = "https://seentrix.com";
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Seentrix",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${slug}`,
    },
    ...(post.ogImage && { image: post.ogImage }),
  };

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <script
        type="application/ld+json"
        // The payload is built from our own data — no user input — so
        // serialising it directly is safe. JSON.stringify escapes any `<`
        // that could close the script tag prematurely.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Back link */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-p2-r text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="ArrowLeft" className="size-4" />
        {t("backToBlog")}
      </Link>

      {/* Header */}
      <header className="mb-10">
        <Badge variant="secondary" className="mb-4">
          {post.category}
        </Badge>
        <h1 className="text-h1 tracking-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-p2-r text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icon name="Calendar" className="size-4" />
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="Clock" className="size-4" />
            {post.readingTime} {t("minRead")}
          </span>
        </div>
      </header>

      {/* Content + TOC grid */}
      <div className="relative grid gap-12 lg:grid-cols-[1fr_200px]">
        {/* MDX Content */}
        <div className="prose">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        {/* Sidebar TOC */}
        {headings.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} title={t("toc")} />
            </div>
          </aside>
        )}
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-16 border-t pt-12">
          <h2 className="mb-6 text-h2">
            {t("relatedPosts")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((rp) => (
              <BlogCard
                key={rp.slug}
                post={rp}
                minRead={t("minRead")}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
