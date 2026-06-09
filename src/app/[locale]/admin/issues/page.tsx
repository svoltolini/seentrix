import { Icon } from "@/components/icon";
import { fetchTopIssues, type SentryIssue } from "@/lib/admin/sentry";
import { formatNumber } from "@/lib/admin/format";

export const runtime = "nodejs";

const LEVEL_STYLE: Record<string, string> = {
  fatal: "bg-destructive/15 text-destructive",
  error: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-muted text-muted-foreground",
  debug: "bg-muted text-muted-foreground",
};

function relTime(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function AdminIssuesPage() {
  const feed = await fetchTopIssues();

  if (!feed.configured) {
    return <SetupHint />;
  }

  if (feed.error) {
    return (
      <div className="rounded-md border border-warning/30 bg-warning/5 p-6 text-p3 text-warning">
        Couldn’t reach Sentry ({feed.error}). Check{" "}
        <code>SENTRY_AUTH_TOKEN</code> and the org/project slugs.
      </div>
    );
  }

  const issues = feed.issues;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-h4 text-foreground">
          Top unresolved issues ({issues.length})
        </h2>
        <span className="text-p4 text-muted-foreground">Last 14 days · live from Sentry</span>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-md bg-card p-8 text-center text-p3 text-muted-foreground shadow-card-sm">
          No unresolved issues. 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {issues.map((i) => (
            <IssueRow key={i.id} issue={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: SentryIssue }) {
  return (
    <a
      href={issue.permalink || undefined}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-between gap-4 rounded-md bg-card p-4 shadow-card-sm transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={
              "rounded-full px-2 py-0.5 text-l6-plus uppercase tracking-wide " +
              (LEVEL_STYLE[issue.level] ?? LEVEL_STYLE.error)
            }
          >
            {issue.level}
          </span>
          <code className="text-p4 text-muted-foreground">{issue.shortId}</code>
        </div>
        <p className="mt-1.5 truncate text-l6 text-foreground">{issue.title}</p>
        {issue.culprit && (
          <p className="truncate text-p4 text-muted-foreground">{issue.culprit}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-p3 text-foreground">
          {formatNumber(issue.count)} events
        </p>
        <p className="text-p4 text-muted-foreground">
          {formatNumber(issue.userCount)} users · {relTime(issue.lastSeen)}
        </p>
      </div>
    </a>
  );
}

function SetupHint() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-card py-16 text-center">
      <Icon name="Warning2" size={28} className="text-muted-foreground" />
      <h3 className="font-heading text-h4 text-foreground">
        Connect the Sentry feed
      </h3>
      <p className="max-w-md text-p3 text-muted-foreground">
        Errors are already being captured in Sentry. To show the top issues here,
        add these environment variables in Vercel:
      </p>
      <div className="mt-1 rounded-md bg-muted px-4 py-3 text-left font-mono text-p4 text-foreground">
        <div>SENTRY_AUTH_TOKEN=<span className="text-muted-foreground">…read-scope token</span></div>
        <div>SENTRY_ADMIN_ORG=seentrix</div>
        <div>SENTRY_ADMIN_PROJECT=javascript-nextjs</div>
        <div>SENTRY_API_BASE=https://de.sentry.io</div>
      </div>
      <p className="max-w-md text-p4 text-muted-foreground">
        The org is in Sentry’s EU region, so <code>SENTRY_API_BASE</code> must
        point at <code>de.sentry.io</code>. Until these are set, Sentry’s own
        dashboard and mobile app already alert you in real time.
      </p>
    </div>
  );
}
