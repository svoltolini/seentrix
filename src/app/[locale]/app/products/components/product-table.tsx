"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ProductListItem } from "../actions";

/**
 * Products table — the Clay data-table treatment (design handoff §4,
 * `.sx-tablecard` + `.sx-table`): uppercase mono-weight headers on the page
 * background, hairline row dividers, hover highlight, whole row clickable.
 * Columns: Product (name + type), Class (category badge), Compliance score
 * (right-aligned value + mini progress bar).
 */

const CATEGORY_CHIP: Record<string, string> = {
  critical: "bg-[#f4e1da] text-[#a8442f]",
  important_class_ii: "bg-[#f1e9da] text-[#856231]",
  important_class_i: "bg-[#e7eef0] text-[#3d6470]",
  default: "bg-muted text-muted-foreground",
};

function scoreColor(score: number): string {
  if (score >= 75) return "var(--primary)";
  if (score >= 50) return "var(--accent)";
  return "var(--destructive)";
}

export function ProductTable({ products }: { products: ProductListItem[] }) {
  const t = useTranslations("products");


  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-background text-left text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">
            <th className="px-4 py-[11px]">{t("table.product")}</th>
            <th className="px-4 py-[11px]">{t("table.class")}</th>
            <th className="px-4 py-[11px] text-right">{t("table.score")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const categoryKey = p.cra_category ?? "default";
            const categoryLabelKey = `categories.${categoryKey}`;
            const typeKey = p.type ? `types.${p.type}` : null;
            return (
              <tr
                key={p.id}
                className="group cursor-pointer border-t border-border transition-colors hover:bg-muted"
              >
                <td className="px-4 py-[11px]">
                  <Link href={`/app/products/${p.id}`} className="flex flex-col">
                    <span className="text-[14.5px] font-semibold tracking-[-0.1px] text-foreground group-hover:text-primary">
                      {p.name}
                    </span>
                    {p.type && (
                      <span className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {typeKey && t.has(typeKey) ? t(typeKey) : p.type}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-[11px]">
                  <span
                    className={`rounded-[7px] px-2.5 py-1 text-[11px] font-bold ${CATEGORY_CHIP[categoryKey] ?? CATEGORY_CHIP.default}`}
                  >
                    {t.has(categoryLabelKey)
                      ? t(categoryLabelKey)
                      : categoryKey.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-[11px]">
                  <div className="flex items-center justify-end gap-3">
                    <span className="w-16 overflow-hidden rounded-full bg-primary-3">
                      <span
                        className="block h-1.5 rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, p.compliance_score))}%`,
                          background: scoreColor(p.compliance_score),
                        }}
                      />
                    </span>
                    <span className="min-w-[34px] text-right text-[15px] font-bold tabular-nums text-foreground">
                      {p.compliance_score}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
