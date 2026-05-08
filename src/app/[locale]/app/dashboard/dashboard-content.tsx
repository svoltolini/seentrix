"use client";

/**
 * Dashboard surface.
 *
 * Two-column Nask layout:
 *   - main column: greeting, Project-Statistics bar chart, featured product
 *     hero cards, today's overdue tasks
 *   - right rail (370px): calendar widget, upcoming CRA deadlines, team
 *     strip, recent-activity feed
 *
 * Widgets live in `./widgets/`. This file's job is to:
 *   - adapt the existing `DashboardStats` data shape into widget props
 *     (bar-chart bucketing, featured-product picker, activity adapter)
 *   - wire the right rail's static CRA deadline list (notified bodies →
 *     reporting → full compliance) into the meeting-list widget
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";
import { MS_PER_DAY } from "@/lib/time";
import type {
  DashboardStats,
  DashboardProduct,
  ActivityItem,
} from "../products/actions";
import type { IncidentWidgetData } from "../incidents/actions";
import type { SupportWidgetData } from "../products/[productId]/releases/actions";
import type { CompanyProfileStatus } from "../settings/actions";

import { ProjectStatisticsCard } from "./widgets/project-statistics-card";
import { ProjectHeroCard } from "./widgets/project-hero-card";
import { DashboardTaskCard, type DashboardTask } from "./widgets/dashboard-task-card";
import { CalendarWidget } from "./widgets/calendar-widget";
import { MeetingsList } from "./widgets/meetings-list";
import {
  ActivityFeedWidget,
  type ActivityFeedItem,
} from "./widgets/activity-feed-widget";
import { TeamChatStrip, type TeamChatItem } from "./widgets/team-chat-strip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Pick the two products most likely to block the next CRA deadline so they
 * sit at the top of the "My Products" hero strip. Lowest compliance below
 * 75% wins; not-yet-assessed products lead.
 */
function pickFeaturedProducts(
  products: DashboardProduct[],
): DashboardProduct[] {
  if (products.length === 0) return [];
  const sorted = [...products].sort((a, b) => {
    const aUn = a.cra_category ? 1 : 0;
    const bUn = b.cra_category ? 1 : 0;
    if (aUn !== bUn) return aUn - bUn;
    return a.compliance_score - b.compliance_score;
  });
  return sorted.slice(0, 2);
}

function categoryGradient(category: string | null): string {
  switch (category) {
    case "critical":
      return "linear-gradient(135deg, #E60019 0%, #FF6D00 60%, #066DE6 100%)";
    case "important_class_ii":
      return "linear-gradient(135deg, #FF6D00 0%, #FF6D00 60%, #066DE6 100%)";
    case "important_class_i":
      return "linear-gradient(135deg, #FF9E55 0%, #066DE6 110%)";
    default:
      return "linear-gradient(135deg, #066DE6 0%, #FF6D00 60%, #FF9E55 100%)";
  }
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  default: "categoryDefault",
  important_class_i: "categoryImportantI",
  important_class_ii: "categoryImportantII",
  critical: "categoryCritical",
};

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

/**
 * Maps every action emitted by `logActivity()` (see `src/lib/activity.ts`
 * call sites) to a Vuesax icon + tone for the avatar/icon column.
 *
 * Action keys use dot-notation `category.verb` (e.g. `member.removed`,
 * `checklist.item_status_changed`) — they're the literal strings the
 * server actions write to the activity log. Underscore-style keys from
 * earlier passes were dead because no logActivity caller actually used
 * them.
 *
 * If a new action lands in the log without a matching entry here it
 * falls through to the muted "Notification" icon, but the body label
 * has its own fallback in dashboard.json (`actionLabels.fallback`) that
 * humanises the raw action name — so a missed icon mapping looks plain
 * but never broken.
 */
const ACTION_ICON: Record<
  string,
  { icon: ActivityFeedItem["icon"]; tone: NonNullable<ActivityFeedItem["iconTone"]> }
> = {
  "billing.checkout_created":              { icon: "Crown",            tone: "primary" },
  "checklist.evidence_removed":            { icon: "Trash",            tone: "muted" },
  "checklist.evidence_uploaded":           { icon: "DocumentUpload",   tone: "success" },
  "checklist.item_description_changed":    { icon: "Edit",             tone: "muted" },
  "checklist.item_status_changed":         { icon: "TickCircle",       tone: "success" },
  "document.pdf_generated":                { icon: "DocumentDownload", tone: "primary" },
  "document.saved":                        { icon: "DocumentText",     tone: "primary" },
  "document.status_changed":               { icon: "DocumentText",     tone: "muted" },
  "member.created":                        { icon: "UserAdd",          tone: "primary" },
  "member.removed":                        { icon: "Trash",            tone: "destructive" },
  "member.role_changed":                   { icon: "Crown",            tone: "primary" },
  "organization.updated":                  { icon: "Building",         tone: "muted" },
  "password.changed":                      { icon: "ShieldTick",       tone: "success" },
  "product.assessed":                      { icon: "Verify",           tone: "success" },
  "product.created":                       { icon: "Box",              tone: "primary" },
  "product.deleted":                       { icon: "Trash",            tone: "destructive" },
  "product.updated":                       { icon: "Edit",             tone: "muted" },
  "profile.updated":                       { icon: "Profile",          tone: "muted" },
  "sbom.deleted":                          { icon: "Trash",            tone: "destructive" },
  "sbom.scanned":                          { icon: "ShieldTick",       tone: "primary" },
  "sbom.uploaded":                         { icon: "DocumentUpload",   tone: "success" },
};

/**
 * Build a human-readable description of an activity event.
 *
 * Source data: every `logActivity()` call writes a row with `action`
 * (dot-notation `category.verb`), `target_type` (e.g. "member",
 * "checklist"), and an optional `target_name`. Some callers don't pass
 * a `target_name` because the target is generic (e.g. removing a member
 * doesn't pass the removed user's name) — in those cases the template
 * in `dashboard.actionLabels.*` is written without the `{target}`
 * placeholder so the output reads as a clean sentence.
 *
 * Templates that DO use `{target}` are only assigned to actions whose
 * emitter reliably passes a `target_name` (e.g. `product.created`,
 * `member.created`, `sbom.uploaded`). When one of those happens to
 * arrive with no name, we substitute a dash so the sentence doesn't
 * end with a trailing space.
 */
function humanizeActivity(
  a: ActivityItem,
  tAction: (key: string, vars?: Record<string, string>) => string,
  tHas: (key: string) => boolean,
): string {
  const target = a.target_name?.trim() || "—";
  const labelKey = `actionLabels.${a.action}`;
  if (tHas(labelKey)) {
    // next-intl ignores extra vars, so passing `target` here is safe
    // even when the template doesn't reference it.
    return tAction(labelKey, { target });
  }
  // Unknown action — drop the underscores and dots for a passable phrase
  // ("checklist item status changed" rather than "checklist.item_status_changed").
  return tAction("actionLabels.fallback", {
    action: a.action.replace(/[._]/g, " "),
  });
}

function adaptActivity(
  a: ActivityItem,
  tAction: (key: string, vars?: Record<string, string>) => string,
  tHas: (key: string) => boolean,
): ActivityFeedItem {
  const meta = ACTION_ICON[a.action] ?? { icon: "Notification", tone: "muted" as const };
  const hasAvatar = !!(a.user_avatar_url || a.user_name);
  return {
    id: a.id,
    title: a.user_name ?? a.user_role ?? "System",
    body: humanizeActivity(a, tAction, tHas),
    occurredAt: a.created_at,
    actor: hasAvatar
      ? { name: a.user_name, avatarUrl: a.user_avatar_url ?? null }
      : undefined,
    icon: hasAvatar ? undefined : meta.icon,
    iconTone: hasAvatar ? undefined : meta.tone,
  };
}

function adaptOverdueToTask(item: DashboardStats["overdueItems"][number]): DashboardTask {
  return {
    id: item.id,
    subtitle: item.productName,
    title: item.title,
    href: `/app/products/${item.productId}/checklist`,
    meta: {
      timeLeft:
        item.daysOverdue > 0
          ? `${item.daysOverdue}d overdue`
          : `Due in ${Math.abs(item.daysOverdue)}d`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DashboardContent(
  stats: DashboardStats & {
    incidentWidget?: IncidentWidgetData;
    supportWidget?: SupportWidgetData;
    profileStatus?: CompanyProfileStatus;
  },
) {
  const t = useTranslations("dashboard");

  const {
    totalProducts,
    products,
    recentActivity,
    currentUser,
    overdueItems,
    activityVelocity,
    profileStatus,
  } = stats;

  const firstName = currentUser?.full_name?.split(" ")[0] ?? null;

  // Bar-chart data for "Project Statistics": Mon→Sun activity counts
  // bucketed from the existing `activityVelocity` series. Two stacks per day:
  // primary = compliance progress events, accent = comparison baseline.
  const chartData = useMemo(() => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    const last7 = activityVelocity.slice(-7);
    const max = Math.max(1, ...last7.map((p) => p.count));
    return days.map((day, i) => {
      const point = last7[i];
      const pct = point ? Math.round((point.count / max) * 100) : 0;
      return {
        day,
        a: pct,
        b: Math.round(pct * 0.55),
      };
    });
  }, [activityVelocity]);

  const featured = useMemo(() => pickFeaturedProducts(products), [products]);

  // CRA regulatory deadlines surface as "today's reviews" in the right rail.
  const deadlines = [
    {
      id: "notified-bodies",
      title: t.has("deadline.notifiedBodies") ? t("deadline.notifiedBodies") : "Notified bodies",
      date: "2026-06-11",
    },
    {
      id: "reporting",
      title: t.has("deadline.reporting") ? t("deadline.reporting") : "Reporting obligations",
      date: "2026-09-11",
    },
    {
      id: "full-compliance",
      title: t.has("deadline.fullCompliance") ? t("deadline.fullCompliance") : "Full compliance",
      date: "2027-12-11",
    },
  ];

  const meetings = deadlines
    .filter((d) => getDaysUntil(d.date) > 0)
    .map((d) => ({
      id: d.id,
      icon: "Calendar" as const,
      title: d.title,
      subtitle: `${getDaysUntil(d.date)} ${t.has("deadline.daysAway") ? t("deadline.daysAway") : "days away"}`,
      cta: {
        label: t.has("deadline.view") ? t("deadline.view") : "View",
      },
    }));

  // Pass `t` + `t.has` into the activity adapter so the humanizer can
  // pick the right action template per locale without leaking the
  // `useTranslations` hook into a pure helper.
  const activityItems = recentActivity
    .slice(0, 6)
    .map((a) => adaptActivity(a, t, (k) => t.has(k)));
  const todayTasks = overdueItems.slice(0, 4).map(adaptOverdueToTask);

  // Team strip — surface up to 5 active org members from recent activity.
  const seenUsers = new Map<string, TeamChatItem>();
  for (const a of recentActivity) {
    if (!a.user_name) continue;
    if (seenUsers.has(a.user_name)) continue;
    seenUsers.set(a.user_name, {
      id: a.user_name,
      name: a.user_name,
      avatarUrl: a.user_avatar_url ?? null,
    });
    if (seenUsers.size >= 5) break;
  }
  const teamMembers = [...seenUsers.values()];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      {/* Greeting + profile callout — span the full width above the grid
          so the Project Statistics card and the Calendar card start at
          the same vertical level inside the columns below. */}
      <div>
        <h1 className="text-h1 text-foreground">
          {firstName ? t("greeting", { name: firstName }) : t("title")}
        </h1>
        <p className="mt-2 text-p2 text-muted-foreground">
          {firstName ? t("greetingSubtitle") : t("subtitle")}
        </p>
      </div>

      {profileStatus && !profileStatus.complete && (
        <ProfileIncompleteBanner
          eyebrow={t("profileIncomplete.eyebrow")}
          title={t("profileIncomplete.title")}
          description={t("profileIncomplete.description")}
          cta={t("profileIncomplete.cta")}
          variant="full"
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_370px]">
        {/* MAIN COLUMN */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Project Statistics bar chart card */}
          <ProjectStatisticsCard data={chartData} />

        {/* My Products — 2 hero cards */}
        {totalProducts > 0 && featured.length > 0 && (
          <section className="flex flex-col gap-4">
            <header className="flex items-center justify-between">
              <h2 className="text-h2 text-foreground">{t("myProducts")}</h2>
              <Link
                href="/app/products"
                className="text-p3 text-primary hover:text-primary/80"
              >
                {t("seeAll")}
              </Link>
            </header>
            <div className="grid gap-5 sm:grid-cols-2">
              {featured.map((p) => {
                const categoryKey = p.cra_category ?? "default";
                const priorityKey = CATEGORY_KEY_MAP[categoryKey] ?? "categoryDefault";
                return (
                  <ProjectHeroCard
                    key={p.id}
                    title={p.name}
                    subtitle={p.type ?? "Product"}
                    href={`/app/products/${p.id}`}
                    score={p.compliance_score}
                    priority={t.has(priorityKey) ? t(priorityKey) : categoryKey.replace(/_/g, " ")}
                    gradient={categoryGradient(categoryKey)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Today's tasks — overdue compliance items */}
        <section className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <h2 className="text-h2 text-foreground">{t("todayTasks")}</h2>
            <Link
              href="/app/incidents"
              className="text-p3 text-primary hover:text-primary/80"
            >
              {t("seeAll")}
            </Link>
          </header>
          {todayTasks.length === 0 ? (
            <div className="flex h-[121px] items-center justify-center rounded-md border border-dashed border-border-outline bg-card text-p3 text-muted-foreground">
              {t("noOverdue")}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {todayTasks.map((task) => (
                <DashboardTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
        </div>

        {/* RIGHT RAIL — 370px. gap-6 between sections matches the p-6
            card padding so inner spacing balances the outer frame. */}
        <aside className="flex min-w-0 flex-col gap-6 rounded-md bg-card p-6 shadow-card-md lg:max-w-[370px]">
          {/* Calendar */}
          <CalendarWidget />

          {/* Meetings / today's deadlines */}
          <section className="flex flex-col gap-4">
            <h3 className="text-h3 text-foreground">
              {t("upcomingDeadlines.title")}
            </h3>
            <MeetingsList meetings={meetings} />
          </section>

          {/* Team */}
          {teamMembers.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-h3 text-foreground">{t("chat")}</h3>
              <TeamChatStrip members={teamMembers} />
            </section>
          )}

          {/* Activity feed */}
          <section className="flex flex-col gap-4">
            <h3 className="text-h3 text-foreground">{t("activity")}</h3>
            <ActivityFeedWidget items={activityItems} />
          </section>
        </aside>
      </div>
    </div>
  );
}
