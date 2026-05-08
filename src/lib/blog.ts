import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  ogImage?: string;
  readingTime: number;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

function calculateReadingTime(content: string): number {
  // Always return at least 1 minute — a "0 min read" badge on a
  // very short post reads as a bug.
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function getAllPosts(locale: string): BlogPostMeta[] {
  if (!isSafeSegment(locale)) return [];
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? "",
      description: data.description ?? "",
      date: data.date ?? "",
      category: data.category ?? "",
      author: data.author ?? "Seentrix Team",
      ogImage: data.ogImage,
      readingTime: calculateReadingTime(content),
    } satisfies BlogPostMeta;
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Allow only `[a-z0-9-_]` slugs and locales — they must round-trip through
 * the filesystem safely. Without this, a request like
 * `/blog/..%2F..%2Fetc%2Fpasswd` could `path.join` its way out of
 * `content/blog/<locale>/`. `existsSync` + the `.mdx` suffix would still
 * limit the blast radius to MDX files anywhere under `cwd`, but the right
 * thing is to refuse the slug outright.
 */
const SAFE_SEGMENT = /^[a-z0-9_-]+$/i;

function isSafeSegment(segment: string): boolean {
  return SAFE_SEGMENT.test(segment);
}

export function getPostBySlug(
  locale: string,
  slug: string
): BlogPost | null {
  if (!isSafeSegment(locale) || !isSafeSegment(slug)) return null;

  const filePath = path.join(CONTENT_DIR, locale, `${slug}.mdx`);
  // Defence-in-depth: confirm the resolved path is still inside the
  // intended content directory after `path.join` normalises any `..`
  // sneakily injected via decoded URL segments.
  const localeDir = path.join(CONTENT_DIR, locale);
  if (!filePath.startsWith(localeDir + path.sep)) return null;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    category: data.category ?? "",
    author: data.author ?? "Seentrix Team",
    ogImage: data.ogImage,
    readingTime: calculateReadingTime(content),
    content,
  };
}

export function getRelatedPosts(
  locale: string,
  currentSlug: string,
  limit = 2
): BlogPostMeta[] {
  const all = getAllPosts(locale);
  const current = all.find((p) => p.slug === currentSlug);
  if (!current) return all.filter((p) => p.slug !== currentSlug).slice(0, limit);

  const sameCategory = all.filter(
    (p) => p.slug !== currentSlug && p.category === current.category
  );
  const others = all.filter(
    (p) => p.slug !== currentSlug && p.category !== current.category
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getAllSlugs(): string[] {
  const enDir = path.join(CONTENT_DIR, "en");
  if (!fs.existsSync(enDir)) return [];
  return fs
    .readdirSync(enDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function extractHeadings(
  content: string
): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}
