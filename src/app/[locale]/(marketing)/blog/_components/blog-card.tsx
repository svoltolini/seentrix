import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { BlogPostMeta } from "@/lib/blog";

export function BlogCard({
  post,
  minRead,
}: {
  post: BlogPostMeta;
  minRead: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="flex h-full flex-col rounded-md border border-border bg-card p-6 shadow-card-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg">
        <div className="mb-3">
          <Badge variant="secondary">{post.category}</Badge>
        </div>

        <h3 className="text-h4 text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>

        <p className="mt-3 flex-1 text-p3 text-muted-foreground">
          {post.description}
        </p>

        <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-p4-r text-muted-foreground">
          <span>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span>
            {post.readingTime} {minRead}
          </span>
        </div>
      </div>
    </Link>
  );
}
