import { getTranslations } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "./_components/blog-card";
import { StaggerReveal } from "@/components/stagger-reveal";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "blog" });
  const baseUrl = "https://seentrix.com";

  return {
    title: `${t("meta.title")} — Seentrix`,
    description: t("meta.description"),
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: `${baseUrl}/blog`,
      type: "website",
    },
  };
}

export default async function BlogPage() {
  const t = await getTranslations({ locale: "en", namespace: "blog" });
  const posts = getAllPosts("en");

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-h1 tracking-tight">
          {t("heading")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("subheading")}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("noPosts")}</p>
      ) : (
        <StaggerReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} minRead={t("minRead")} />
          ))}
        </StaggerReveal>
      )}
    </section>
  );
}
