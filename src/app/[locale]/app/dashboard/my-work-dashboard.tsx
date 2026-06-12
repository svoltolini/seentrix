"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { LearnScreenContext } from "@/components/academy/learn-fab";
import { requiredLessonsForRole } from "@/lib/academy/lessons";
import { ACADEMY_LESSONS } from "@/lib/glossary";
import type { RoleId } from "@/lib/academy/types";
import type { MyWorkStats, MyTask, MyVuln } from "./my-work-actions";

/**
 * My Work dashboard — the editor's home. Instead of org-wide statistics it
 * answers "what should I do next": the checklist items and vulnerabilities
 * assigned to me, my training progress, all in the shared list recipes.
 */

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--destructive)",
  high: "var(--sev-high, var(--destructive))",
  medium: "var(--warning)",
  low: "var(--muted-foreground)",
};

export function MyWorkDashboard({ stats }: { stats: MyWorkStats }) {
  const t = useTranslations("dashboard.myWork");
  const tc = useTranslations("checklist");

  const total = stats.openTaskCount + stats.doneTaskCount;
  const pct = total > 0 ? Math.round((stats.doneTaskCount / total) * 100) : 0;

  const overdueCount = stats.tasks.filter(
    (t) => t.daysOverdue !== null && t.daysOverdue > 0,
  ).length;

  function taskTitle(task: MyTask) {
    const ns = task.part === "part_i" ? "requirements" : "vulnerabilityRequirements";
    const key = `${ns}.${task.requirementId}.title`;
    return tc.has(key) ? tc(key) : task.requirementId;
  }

  // Training — required lessons for the role with completion state.
  const training = useMemo(() => {
    const required = stats.role
      ? requiredLessonsForRole(stats.role as RoleId)
      : [];
    const done = new Set(stats.completedLessonIds);
    const items = required.map((id) => ({
      id,
      title:
        ACADEMY_LESSONS[id as keyof typeof ACADEMY_LESSONS]?.title ?? id,
      done: done.has(id),
    }));
    return {
      items,
      doneCount: items.filter((i) => i.done).length,
      total: items.length,
    };
  }, [stats.role, stats.completedLessonIds]);

  return (
    <div className="flex w-full flex-col gap-3.5">
      <LearnScreenContext screenKey="dashboard" />

      {/* Hero — greeting + my-progress ring */}
      <section className="flex flex-wrap items-center gap-6 rounded-lg bg-dark-cta px-[30px] py-[26px] text-white">
        <ProgressRing pct={pct} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-[26px] font-semibold leading-[1.1] tracking-[-0.4px]">
            {stats.firstName
              ? t("greeting", { name: stats.firstName })
              : t("greetingNoName")}
          </h1>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/70">
            {stats.openTaskCount > 0
              ? t("summary", {
                  open: stats.openTaskCount,
                  overdue: overdueCount,
                })
              : t("summaryClear")}
          </p>
        </div>
      </section>

      <div className="grid gap-3.5 lg:grid-cols-[1fr_370px]">
        {/* MAIN — Next up */}
        <div className="flex min-w-0 flex-col gap-3.5">
          <section className="space-y-3">
            <header className="flex items-baseline justify-between gap-4">
              <h2 className="text-h4 text-foreground">{t("nextUp")}</h2>
              <Link
                href="/app/products"
                className="text-[13.5px] font-semibold text-primary hover:underline"
              >
                {t("allProducts")} →
              </Link>
            </header>
            {stats.tasks.length === 0 ? (
              <EmptyState
                icon="checkmark-badge-01-stroke-rounded"
                title={t("noTasksTitle")}
                body={t("noTasksBody")}
              />
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {stats.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    title={taskTitle(task)}
                    statusLabel={tc(`statuses.${task.status}`)}
                    overdueLabel={(n) => t("overdueDays", { days: n })}
                    dueInLabel={(n) => t("dueInDays", { days: n })}
                    dueTodayLabel={t("dueToday")}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Assigned vulnerabilities */}
          {stats.vulns.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-h4 text-foreground">{t("yourVulns")}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {stats.vulns.map((v) => (
                  <VulnRow key={v.id} vuln={v} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RAIL — training */}
        <aside className="flex min-w-0 flex-col gap-3.5 lg:max-w-[370px]">
          <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h4 text-foreground">{t("training")}</h3>
              {training.total > 0 && (
                <span className="text-p4 tabular-nums text-muted-foreground">
                  {training.doneCount}/{training.total}
                </span>
              )}
            </div>
            {training.items.length === 0 ? (
              <p className="text-p4 text-muted-foreground">{t("noTraining")}</p>
            ) : (
              <ul className="space-y-1">
                {training.items.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/app/academy/${l.id}`}
                      className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/60"
                    >
                      <Icon
                        name={
                          l.done
                            ? "checkmark-circle-01-stroke-rounded"
                            : "circle-stroke-rounded"
                        }
                        size={16}
                        className={l.done ? "text-success" : "text-muted-foreground"}
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-p3",
                          l.done
                            ? "text-muted-foreground"
                            : "text-foreground group-hover:text-primary",
                        )}
                      >
                        {l.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  title,
  statusLabel,
  overdueLabel,
  dueInLabel,
  dueTodayLabel,
}: {
  task: MyTask;
  title: string;
  statusLabel: string;
  overdueLabel: (n: number) => string;
  dueInLabel: (n: number) => string;
  dueTodayLabel: string;
}) {
  const overdue = task.daysOverdue !== null && task.daysOverdue > 0;
  const due =
    task.daysOverdue === null
      ? null
      : task.daysOverdue > 0
        ? overdueLabel(task.daysOverdue)
        : task.daysOverdue === 0
          ? dueTodayLabel
          : dueInLabel(Math.abs(task.daysOverdue));

  return (
    <Link
      href={`/app/products/${task.productId}/checklist`}
      className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-l6 text-foreground">{title}</span>
        <span className="block text-p4 text-muted-foreground">
          {task.productName} · {statusLabel}
        </span>
      </span>
      {due && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            overdue
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          {due}
        </span>
      )}
    </Link>
  );
}

function VulnRow({ vuln }: { vuln: MyVuln }) {
  const color = SEVERITY_COLOR[vuln.severity] ?? "var(--muted-foreground)";
  return (
    <Link
      href={`/app/products/${vuln.productId}/vulnerabilities`}
      className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-l6 text-foreground">
          {vuln.cveId ?? "—"}
        </span>
        <span className="block text-p4 text-muted-foreground">
          {vuln.productName}
        </span>
      </span>
      <span
        className="shrink-0 text-[11px] font-bold uppercase tracking-wide"
        style={{ color }}
      >
        {vuln.severity}
      </span>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[color:var(--primary-3)] text-primary">
        <Icon name={icon} size={20} />
      </span>
      <p className="text-h5 text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-p3 text-muted-foreground">{body}</p>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 96;
  const thickness = 9;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[22px] font-semibold text-white">
        {pct}
        <span className="text-[12px] text-white/60">%</span>
      </span>
    </div>
  );
}
