"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/stripe/actions";
import { Link } from "@/i18n/navigation";
import type { OrgPlan } from "@/lib/constants/plans";

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  professional: 59,
  business: 199,
  enterprise: 749,
};

export function BillingContent({
  plan,
  billingPeriodEnd,
  hasSubscription,
  isAdmin,
}: {
  plan: OrgPlan;
  billingPeriodEnd: string | null;
  hasSubscription: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("billing");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [loading, setLoading] = useState(false);

  const price = PLAN_PRICE[plan] ?? 0;

  async function handleManageSubscription() {
    setLoading(true);
    const result = await createPortalSession(locale);

    if (result.url) {
      window.location.href = result.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="rounded-lg bg-white/[0.03] px-4 py-3 text-center text-xs text-muted-foreground">
          {t("readOnly")}
        </div>
      )}

      {/* Current plan */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: "linear-gradient(135deg, #D97706, #EA580C)" }}
      >
        <div className="flex items-center justify-between px-6 py-6">
          {/* Left — plan info */}
          <div>
            <p className="text-[11px] font-semibold text-white/75">
              {t("currentPlan")}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-white">
              {t(`plans.${plan}`)}
            </p>
            {billingPeriodEnd && (
              <p className="mt-1.5 text-xs text-white/65">
                {t("nextBillingDate", {
                  date: new Date(billingPeriodEnd).toLocaleDateString(
                    locale === "de" ? "de-DE" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  ),
                })}
              </p>
            )}
            {plan === "free" && (
              <p className="mt-1.5 max-w-xs text-xs text-white/65">
                {t("upgradeDescription")}
              </p>
            )}
          </div>

          {/* Right — price */}
          <div className="text-right">
            <p className="text-4xl font-bold tracking-tight text-white">
              {price > 0 ? `€${price}` : t(`plans.free`)}
            </p>
            {price > 0 && (
              <p className="mt-0.5 text-xs text-white/65">
                {t("perMonth")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action below card */}
      {isAdmin && (
        <div>
          {hasSubscription ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              {loading ? t("redirecting") : t("manageSubscription")}
            </Button>
          ) : (
            <Link href="/pricing">
              <Button size="sm">
                {t("upgradePlan")}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
