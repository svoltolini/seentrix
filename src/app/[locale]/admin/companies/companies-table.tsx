"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { formatEur, formatDate } from "@/lib/admin/format";

export interface CompanyRow {
  id: string;
  name: string;
  country: string | null;
  plan: "free" | "professional" | "business" | "enterprise";
  mrr: number;
  seats: number;
  aiBoost: boolean;
  status: "active" | "canceling" | "free";
  createdAt: string;
}

type SortKey = "name" | "plan" | "mrr" | "seats" | "createdAt";

const PLAN_RANK: Record<CompanyRow["plan"], number> = {
  free: 0,
  professional: 1,
  business: 2,
  enterprise: 3,
};

const STATUS_STYLE: Record<CompanyRow["status"], string> = {
  active: "bg-success/10 text-success",
  canceling: "bg-warning/10 text-warning",
  free: "bg-muted text-muted-foreground",
};

export function CompaniesTable({ rows }: { rows: CompanyRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.country ?? "").toLowerCase().includes(q),
        )
      : rows;

    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "plan":
          cmp = PLAN_RANK[a.plan] - PLAN_RANK[b.plan];
          break;
        case "mrr":
          cmp = a.mrr - b.mrr;
          break;
        case "seats":
          cmp = a.seats - b.seats;
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return cmp * dir;
    });
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Icon
          name="SearchNormal1"
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or country…"
          className="h-10 w-full rounded-md bg-input pl-9 pr-3 text-p3 text-foreground outline-none border-[1.5px] border-transparent focus:bg-card focus:border-primary/30"
        />
      </div>

      <div className="overflow-x-auto rounded-md bg-card shadow-card-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-l6-plus uppercase tracking-wide text-muted-foreground">
              <SortHead label="Company" k="name" {...{ sortKey, sortDir, toggleSort }} />
              <SortHead label="Plan" k="plan" {...{ sortKey, sortDir, toggleSort }} />
              <th className="px-4 py-2.5">Status</th>
              <SortHead label="MRR" k="mrr" align="right" {...{ sortKey, sortDir, toggleSort }} />
              <SortHead label="Seats" k="seats" align="right" {...{ sortKey, sortDir, toggleSort }} />
              <SortHead label="Joined" k="createdAt" align="right" {...{ sortKey, sortDir, toggleSort }} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-p3 text-muted-foreground">
                  No companies match “{query}”.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="text-p3 transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/companies/${r.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.country && (
                      <span className="ml-2 text-p4 text-muted-foreground">
                        {r.country}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-foreground">{r.plan}</span>
                    {r.aiBoost && (
                      <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-l6-plus uppercase text-primary">
                        Boost
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-l6-plus uppercase tracking-wide",
                        STATUS_STYLE[r.status],
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {r.mrr > 0 ? formatEur(r.mrr) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {r.seats}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHead({
  label,
  k,
  align = "left",
  sortKey,
  sortDir,
  toggleSort,
}: {
  label: string;
  k: SortKey;
  align?: "left" | "right";
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  toggleSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className={cn("px-4 py-2.5", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          "inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        {active && (
          <Icon name={sortDir === "asc" ? "ArrowUp2" : "ArrowDown2"} size={12} />
        )}
      </button>
    </th>
  );
}
