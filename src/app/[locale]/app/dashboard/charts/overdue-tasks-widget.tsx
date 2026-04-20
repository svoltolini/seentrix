"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HugeIcon } from "@/components/huge-icon";
import type { OverdueItem } from "../../products/actions";

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-[#DC2626]",
  high: "bg-[#D97706]",
  medium: "bg-[#3B82F6]",
  low: "bg-[#6B7280]",
};

interface Props {
  count: number;
  items: OverdueItem[];
}

export function OverdueTasksWidget({ count, items }: Props) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
          {t("overdueTasks.eyebrow")}
        </p>
        <h2 className="mt-1 font-heading text-base font-bold text-foreground">
          {t("overdueTasks.title")}
        </h2>
      </div>

      {count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <HugeIcon
            name="checkmark-circle-01-stroke-rounded"
            size={40}
            className="mb-3 text-[#16A34A]"
          />
          <p className="text-sm font-medium text-[#16A34A]">
            {t("overdueTasks.allOnTrack")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            {t("overdueTasks.allOnTrackDescription")}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-3xl font-bold tabular-nums text-[#DC2626]">
            {count}
          </p>
          <div className="space-y-2.5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/app/products/${item.productId}/checklist`}
                className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? PRIORITY_DOT.medium}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50">
                    {item.productName}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#DC2626]">
                  {t("overdueTasks.daysOverdue", { days: item.daysOverdue })}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
