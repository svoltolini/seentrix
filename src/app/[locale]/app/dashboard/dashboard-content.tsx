"use client";

/**
 * Dashboard surface.
 *
 * Behaviour:
 *   - Brand-new orgs with no products see the GetStartedGuide (an ordered,
 *     CRA-aware next-steps checklist) instead of an empty dashboard.
 *   - Established orgs see the full two-column layout:
 *       main column   — KPI strip, Project-Statistics activity chart,
 *                       featured product hero cards, today's overdue tasks
 *       right rail     — CRA calendar tracker (deadlines + tasks), upcoming
 *                       CRA deadlines, team strip, recent-activity feed
 *
 * Widgets live in `./widgets/`. This file adapts the `DashboardStats` shape
 * into widget props (KPIs, chart buckets, featured-product picker, calendar
 * events, activity adapter) and computes the shared onboarding/project state.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";
import {
  getOnboardingState,
  type OnboardingStatsInput,
} from "@/lib/onboarding-state";
import { upcomingCraDeadlines, nextCraDeadline } from "@/lib/constants/cra-deadlines";
import { daysUntil } from "@/lib/time";
import type {
  DashboardStats,
  DashboardProduct,
  ActivityItem,
} from "../products/actions";
import type { IncidentWidgetData } from "../incidents/actions";
import type { SupportWidgetData } from "../products/[productId]/releases/actions";
import type { CompanyProfileStatus } from "../settings/actions";

import {
  ProjectStatisticsCard,
  type DayActivity,
} from "./widgets/project-statistics-card";
import { ProjectHeroCard } from "./widgets/project-hero-card";
import { DashboardTaskCard, type DashboardTask } from "./widgets/dashboard-task-card";
import {
  CraCalendarTracker,
  type CalendarEvent,
} from "./widgets/cra-calendar-tracker";
import { MeetingsList } from "./widgets/meetings-list";
import {
  ActivityFeedWidget,
  type ActivityFeedItem,
} from "./widgets/activity-feed-widget";
import { TeamChatStrip, type TeamChatItem } from "./widgets/team-chat-strip";
import { GetStartedGuide } from "./widgets/get-started-guide";
import { KpiStrip, type Kpi } from "./widgets/kpi-strip";
import { useCopilot } from "@/components/copilot/copilot-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const CATEGORY_KEY_MAP: Record<string, string> = {
  default: "categoryDefault",
  important_class_i: "categoryImportantI",
  important_class_ii: "categoryImportantII",
  critical: "categoryCritical",
};

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

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

/** Capitalise the first letter of a phrase (used for the fallback label). */
function capitalizeFirst(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function humanizeActivity(
  a: ActivityItem,
  tAction: (key: string, vars?: Record<string, string>) => string,
  tHas: (key: string) => boolean,
): string {
  const target = a.target_name?.trim() || "—";
  const labelKey = `actionLabels.${a.action}`;
  if (tHas(labelKey)) {
    return tAction(labelKey, { target });
  }
  // Unknown action — humanise the raw key and capitalise the first word so the
  // activity feed and the settings audit log never show a lowercase fragment
  // like "checklist item status changed".
  return capitalizeFirst(
    tAction("actionLabels.fallback", {
      action: a.action.replace(/[._]/g, " "),
    }),
  );
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
  const { open: openCopilot } = useCopilot();

  const {
    totalProducts,
    products,
    recentActivity,
    currentUser,
    overdueItems,
    overdueCount,
    activityVelocity,
    avgCompliance,
    assessedCount,
    openVulnCount,
    criticalCount,
    totalVulnerabilities,
    profileStatus,
  } = stats;

  const firstName = currentUser?.full_name?.split(" ")[0] ?? null;

  // ---- Onboarding / project state (shared with the Copilot) --------------
  const onboardingStatsInput: OnboardingStatsInput = useMemo(
    () => ({
      totalProducts,
      assessedCount,
      products: products.map((p) => ({
        has_sbom: p.has_sbom,
        cra_category: p.cra_category,
      })),
      openVulnCount,
      totalVulnerabilities,
      overdueCount,
    }),
    [
      totalProducts,
      assessedCount,
      products,
      openVulnCount,
      totalVulnerabilities,
      overdueCount,
    ],
  );

  const onboardingState = useMemo(
    () =>
      getOnboardingState({
        stats: onboardingStatsInput,
        profile: { complete: profileStatus?.complete ?? false },
      }),
    [onboardingStatsInput, profileStatus?.complete],
  );

  // ---- Bar-chart data: dense daily activity series, real dates ------------
  // The card buckets these by the selected timeframe (week/month/year) using
  // each point's real date — no positional weekday guessing.
  const chartData = useMemo<DayActivity[]>(
    () =>
      activityVelocity.map((p) => ({ date: p.date, count: p.count })),
    [activityVelocity],
  );

  const featured = useMemo(() => pickFeaturedProducts(products), [products]);

  // ---- KPI strip ---------------------------------------------------------
  const kpis = useMemo<Kpi[]>(() => {
    const next = nextCraDeadline();
    const list: Kpi[] = [
      {
        id: "products",
        label: t("kpi.products"),
        value: String(totalProducts),
        caption: t("kpi.productsAssessed", { count: assessedCount }),
        icon: "Box",
        tone: "primary",
        href: "/app/products",
      },
      {
        id: "compliance",
        label: t("kpi.avgCompliance"),
        value: `${avgCompliance}%`,
        icon: "Verify",
        tone: avgCompliance >= 75 ? "success" : "neutral",
        href: "/app/products",
      },
      {
        id: "openVulns",
        label: t("kpi.openVulns"),
        value: String(openVulnCount),
        caption:
          criticalCount > 0
            ? t("kpi.criticalCount", { count: criticalCount })
            : undefined,
        icon: "Danger",
        tone: criticalCount > 0 ? "danger" : openVulnCount > 0 ? "warning" : "success",
        href: "/app/vulnerability-reports",
      },
      {
        id: "overdue",
        label: t("kpi.overdue"),
        value: String(overdueCount),
        icon: "Clock",
        tone: overdueCount > 0 ? "warning" : "success",
        href: "/app/incidents",
      },
    ];
    if (next) {
      list.push({
        id: "deadline",
        label: t(`deadline.${next.labelKey}`),
        value: t("kpi.daysValue", { days: Math.max(0, daysUntil(next.date)) }),
        caption: new Date(next.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        icon: "Calendar",
        tone: "neutral",
        href: "/app/products",
      });
    }
    return list;
  }, [
    t,
    totalProducts,
    assessedCount,
    avgCompliance,
    openVulnCount,
    criticalCount,
    overdueCount,
  ]);

  // ---- Right-rail upcoming CRA deadlines (meeting-list cards) -------------
  // The "View" CTA opens the Copilot with a deadline-specific question so the
  // AI can explain what that milestone means and what the user needs to have
  // done by then — more useful than navigating to a static page.
  const meetings = upcomingCraDeadlines().map((d) => {
    const deadlineName = t(`deadline.${d.labelKey}`);
    const deadlineDate = new Date(d.date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const seed = `Explain the CRA "${deadlineName}" deadline on ${deadlineDate}: what does it mean, what do I need to have in place and do before that date, and how does it apply to my products in Seentrix?`;
    return {
      id: d.id,
      icon: "Calendar" as const,
      title: deadlineName,
      subtitle: `${daysUntil(d.date)} ${
        t.has("deadline.daysAway") ? t("deadline.daysAway") : "days away"
      }`,
      cta: {
        label: t.has("deadline.explain")
          ? t("deadline.explain")
          : t.has("deadline.view")
            ? t("deadline.view")
            : "Explain",
        onClick: () => openCopilot(seed),
      },
    };
  });

  // ---- Calendar tracker events (CRA deadlines + overdue tasks) -----------
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const deadlineEvents: CalendarEvent[] = upcomingCraDeadlines().map((d) => ({
      id: `deadline-${d.id}`,
      date: d.date,
      title: t(`deadline.${d.labelKey}`),
      tone: "deadline",
    }));
    const taskEvents: CalendarEvent[] = overdueItems
      .slice(0, 20)
      .map((item) => {
        // Overdue items don't carry a due date in DashboardStats, so anchor a
        // tracker marker on today — they're work that needs doing now.
        const today = new Date();
        const key = `${today.getFullYear()}-${String(
          today.getMonth() + 1,
        ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        return {
          id: `task-${item.id}`,
          date: key,
          title: item.title,
          tone: "task" as const,
          href: `/app/products/${item.productId}/checklist`,
        };
      });
    return [...deadlineEvents, ...taskEvents];
  }, [t, overdueItems]);

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
    if (seenUsers.size >= 6) break;
  }
  const teamMembers = [...seenUsers.values()];

  // ---- Empty-state guidance for brand-new orgs ---------------------------
  if (onboardingState.isEmpty) {
    return (
      <div className="flex w-full flex-col gap-6">
        {profileStatus && !profileStatus.complete && (
          <ProfileIncompleteBanner
            eyebrow={t("profileIncomplete.eyebrow")}
            title={t("profileIncomplete.title")}
            description={t("profileIncomplete.description")}
            cta={t("profileIncomplete.cta")}
            variant="full"
          />
        )}
        <GetStartedGuide state={onboardingState} firstName={firstName} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
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

      {/* KPI strip — full width above the columns */}
      <KpiStrip kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-[1fr_370px]">
        {/* MAIN COLUMN */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Project Statistics activity chart */}
          <ProjectStatisticsCard points={chartData} />

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

        {/* RIGHT RAIL */}
        <aside className="flex min-w-0 flex-col gap-4 lg:max-w-[370px]">
          {/* CRA calendar tracker */}
          <section className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-card-md">
            <h3 className="text-h3 text-foreground">{t("calendar.title")}</h3>
            <CraCalendarTracker events={calendarEvents} />
          </section>

          {/* Upcoming CRA deadlines */}
          <section className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-card-md">
            <h3 className="text-h3 text-foreground">
              {t("upcomingDeadlines.title")}
            </h3>
            <MeetingsList meetings={meetings} />
          </section>

          {/* Team */}
          {teamMembers.length > 0 && (
            <section className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-card-md">
              <h3 className="text-h3 text-foreground">{t("team")}</h3>
              <TeamChatStrip members={teamMembers} />
            </section>
          )}

          {/* Activity feed */}
          <section className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-card-md">
            <h3 className="text-h3 text-foreground">{t("activity")}</h3>
            <ActivityFeedWidget items={activityItems} />
          </section>
        </aside>
      </div>
    </div>
  );
}
