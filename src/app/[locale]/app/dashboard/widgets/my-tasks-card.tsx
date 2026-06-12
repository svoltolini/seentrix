"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MyTask, MyVuln } from "../my-work-actions";

/**
 * "My tasks" rail card for the org dashboard — gives leadership (admin /
 * compliance officer / CTO) a glance at their own assigned checklist items
 * and vulnerabilities without leaving the org view. Fed by getMyWorkStats.
 */

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--destructive)",
  high: "var(--destructive)",
  medium: "var(--warning)",
  low: "var(--muted-foreground)",
};

export function MyTasksCard({
  tasks,
  vulns,
}: {
  tasks: MyTask[];
  vulns: MyVuln[];
}) {
  const t = useTranslations("dashboard.myWork");
  const tc = useTranslations("checklist");

  if (tasks.length === 0 && vulns.length === 0) return null;

  function taskTitle(task: MyTask) {
    const ns = task.part === "part_i" ? "requirements" : "vulnerabilityRequirements";
    const key = `${ns}.${task.requirementId}.title`;
    return tc.has(key) ? tc(key) : task.requirementId;
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-h4 text-foreground">{t("myTasks")}</h3>

      {tasks.length > 0 && (
        <ul className="-mx-1.5">
          {tasks.slice(0, 5).map((task) => {
            const overdue = task.daysOverdue !== null && task.daysOverdue > 0;
            return (
              <li key={task.id}>
                <Link
                  href={`/app/products/${task.productId}/checklist`}
                  className="flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-l6 text-foreground">
                      {taskTitle(task)}
                    </span>
                    <span className="block truncate text-p4 text-muted-foreground">
                      {task.productName}
                    </span>
                  </span>
                  {overdue && (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                      {t("overdueDays", { days: task.daysOverdue ?? 0 })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {vulns.length > 0 && (
        <>
          {tasks.length > 0 && <div className="h-px bg-border" />}
          <ul className="-mx-1.5">
            {vulns.slice(0, 4).map((v) => {
              const color = SEVERITY_COLOR[v.severity] ?? "var(--muted-foreground)";
              return (
                <li key={v.id}>
                  <Link
                    href={`/app/products/${v.productId}/vulnerabilities`}
                    className="flex items-center gap-2.5 rounded-md px-1.5 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-l6 text-foreground">
                      {v.cveId ?? "—"}
                    </span>
                    <span
                      className="shrink-0 text-[11px] font-bold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {v.severity}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
