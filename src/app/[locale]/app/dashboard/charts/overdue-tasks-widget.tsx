"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import type { OverdueItem } from "../../products/actions";

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-[#DC2626]",
  high: "bg-[#D97706]",
  medium: "bg-[#066DE6]",
  low: "bg-[#6B7280]",
};

interface Props {
  count: number;
  items: OverdueItem[];
}

export function OverdueTasksWidget({ count, items }: Props) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex h-full flex-col rounded-md bg-muted p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
          {t("overdueTasks.eyebrow")}
        </p>
        <h2 className="mt-1 text-h5 text-foreground">
          {t("overdueTasks.title")}
        </h2>
      </div>

      {count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <Icon
            name="checkmark-circle-01-stroke-rounded"
            size={40}
            className="mb-3 text-[#16A34A]"
          />
          <p className="text-sm font-medium text-[#16A34A]">
            {t("overdueTasks.allOnTrack")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
                className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? PRIORITY_DOT.medium}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.productName}
                  </p>
                </div>
                <span className="shrink-0 text-l6-plus tabular-nums text-[#DC2626]">
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
