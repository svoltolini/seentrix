import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeIcon } from "@/components/huge-icon";
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
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
        {/* Thumbnail placeholder */}
        <div className="h-40 bg-gradient-to-br from-primary/10 to-[#8B5CF6]/10" />

        <CardHeader>
          <div className="mb-2">
            <Badge variant="secondary">{post.category}</Badge>
          </div>
          <CardTitle className="text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4 border-t pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HugeIcon
                name="calendar-03-stroke-rounded"
                size={14}
                className="text-muted-foreground"
              />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <HugeIcon
                name="time-quarter-02-stroke-rounded"
                size={14}
                className="text-muted-foreground"
              />
              {post.readingTime} {minRead}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
