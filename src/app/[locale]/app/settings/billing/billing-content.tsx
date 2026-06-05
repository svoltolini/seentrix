"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/lib/stripe/actions";
import { Link } from "@/i18n/navigation";
import type { OrgPlan } from "@/lib/constants/plans";
import { PLAN_PRICES_EUR } from "@/lib/constants/plans";

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
  const [loading, setLoading] = useState(false);

  const price = PLAN_PRICES_EUR[plan]?.monthly ?? 0;

  async function handleManageSubscription() {
    setLoading(true);
    const result = await createPortalSession();

    if (result.url) {
      window.location.href = result.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="rounded-md bg-muted px-4 py-3 text-center text-p3 text-muted-foreground">
          {t("readOnly")}
        </div>
      )}

      {/* Current plan — orange accent panel (design-language accent surface).
          Gradient is built from the accent tokens, not raw hex. */}
      <div
        className="overflow-hidden rounded-md"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent))",
        }}
      >
        <div className="flex items-center justify-between px-6 py-6">
          {/* Left — plan info */}
          <div>
            <p className="text-l6-plus text-white">
              {t("currentPlan")}
            </p>
            <p className="mt-1 text-h3 tracking-tight text-white">
              {t(`plans.${plan}`)}
            </p>
            {billingPeriodEnd && (
              <p className="mt-1.5 text-p4 text-white">
                {t("nextBillingDate", {
                  date: new Date(billingPeriodEnd).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  ),
                })}
              </p>
            )}
            {plan === "free" && (
              <p className="mt-1.5 max-w-xs text-p4 text-white">
                {t("upgradeDescription")}
              </p>
            )}
          </div>

          {/* Right — price */}
          <div className="text-right">
            <p className="text-h1 tracking-tight text-white">
              {price > 0 ? `€${price}` : t(`plans.free`)}
            </p>
            {price > 0 && (
              <p className="mt-0.5 text-p4 text-white">
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
