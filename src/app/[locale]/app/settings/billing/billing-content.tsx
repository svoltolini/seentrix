"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  changePlan,
  cancelSubscription,
  resumeSubscription,
  resyncSubscription,
  createPortalSession,
  addAiBoost,
  removeAiBoost,
} from "@/lib/stripe/actions";
import type { OrgPlan, BillingCurrency } from "@/lib/constants/plans";
import {
  PLAN_PRICES_EUR,
  AI_BOOST_PRICE,
  AI_BOOST_BONUS_MESSAGES,
  canBuyAiBoost,
  formatPrice,
} from "@/lib/constants/plans";

type Interval = "monthly" | "annual";
type PaidPlan = "professional" | "business";

// Self-serve tiers shown as cards. Enterprise is routed to a contact band.
const TIERS: OrgPlan[] = ["free", "professional", "business"];
const RANK: Record<string, number> = { free: 0, professional: 1, business: 2 };

type Pending =
  | { kind: "cancel" }
  | { kind: "change"; plan: PaidPlan; interval: Interval; direction: "upgrade" | "downgrade" | "switch" };

export function BillingContent({
  plan,
  billingPeriodEnd,
  billingInterval,
  cancelAtPeriodEnd,
  currency,
  aiBoost,
  hasSubscription,
  hasCustomer,
  isAdmin,
}: {
  plan: OrgPlan;
  billingPeriodEnd: string | null;
  billingInterval: Interval | null;
  cancelAtPeriodEnd: boolean;
  currency: BillingCurrency;
  aiBoost: boolean;
  hasSubscription: boolean;
  hasCustomer: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("billing");
  const tp = useTranslations("pricing");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [interval, setIntervalState] = useState<Interval>(
    billingInterval ?? "monthly",
  );
  const [pending, setPending] = useState<Pending | null>(null);

  const currentInterval: Interval | null = billingInterval;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  function notifyResult(res: { ok?: boolean; error?: string }, okMsg: string) {
    if (res.ok) {
      toast({ type: "success", message: okMsg });
      router.refresh();
    } else {
      const map: Record<string, string> = {
        samePlan: t("feedback.samePlan"),
        notAdmin: t("feedback.notAdmin"),
        noSubscription: t("feedback.error"),
      };
      toast({ type: "error", message: map[res.error ?? ""] ?? t("feedback.error") });
    }
  }

  function runChange(targetPlan: PaidPlan, targetInterval: Interval) {
    startTransition(async () => {
      const res = await changePlan(targetPlan, targetInterval);
      setPending(null);
      if (res.url) {
        setRedirecting(true);
        window.location.assign(res.url);
        return;
      }
      notifyResult(res, t("feedback.changed"));
    });
  }

  function runCancel() {
    startTransition(async () => {
      const res = await cancelSubscription();
      setPending(null);
      notifyResult(res, t("feedback.canceled"));
    });
  }

  function runResume() {
    startTransition(async () => {
      const res = await resumeSubscription();
      notifyResult(res, t("feedback.resumed"));
    });
  }

  function runResync() {
    startTransition(async () => {
      const res = await resyncSubscription();
      notifyResult(res, t("feedback.synced"));
    });
  }

  function runAddBoost() {
    startTransition(async () => {
      const res = await addAiBoost();
      notifyResult(res, t("feedback.boostAdded"));
    });
  }

  function runRemoveBoost() {
    startTransition(async () => {
      const res = await removeAiBoost();
      notifyResult(res, t("feedback.boostRemoved"));
    });
  }

  async function handleManage() {
    setRedirecting(true);
    const res = await createPortalSession();
    if (res.url) window.location.assign(res.url);
    else {
      setRedirecting(false);
      toast({ type: "error", message: t("feedback.error") });
    }
  }

  // Decide what a given plan card's primary action is, relative to the
  // current subscription + the selected interval.
  function cardAction(cardPlan: OrgPlan):
    | { label: string; variant: "default" | "outline" | "destructive"; onClick: () => void; disabled?: boolean }
    | { currentBadge: true }
    | null {
    if (!isAdmin) return null;

    // FREE card.
    if (cardPlan === "free") {
      if (plan === "free") return { currentBadge: true };
      // Paying user: the free card is "cancel" (downgrade to free at period end).
      if (cancelAtPeriodEnd) {
        return {
          label: t("actions.resume"),
          variant: "outline",
          onClick: runResume,
        };
      }
      return {
        label: t("actions.cancel"),
        variant: "outline",
        onClick: () => setPending({ kind: "cancel" }),
      };
    }

    const target = cardPlan as PaidPlan;

    // Current plan, same interval → it's the active plan.
    if (plan === target && currentInterval === interval && !cancelAtPeriodEnd) {
      return { currentBadge: true };
    }
    // Current plan but the interval toggle differs → offer to switch interval.
    if (plan === target && currentInterval && currentInterval !== interval) {
      return {
        label:
          interval === "annual"
            ? t("actions.switchToAnnual")
            : t("actions.switchToMonthly"),
        variant: "outline",
        onClick: () => runChange(target, interval),
      };
    }

    // From free → paid: initial purchase (Checkout). No confirm; Stripe's
    // checkout page is the confirmation.
    if (plan === "free") {
      return {
        label: t("actions.upgrade"),
        variant: target === "professional" ? "default" : "outline",
        onClick: () => runChange(target, interval),
      };
    }

    // Paid → paid: upgrade or downgrade with proration → confirm first.
    const direction =
      RANK[target] > RANK[plan]
        ? "upgrade"
        : RANK[target] < RANK[plan]
          ? "downgrade"
          : "switch";
    return {
      label: direction === "downgrade" ? t("actions.downgrade") : t("actions.upgrade"),
      variant: direction === "upgrade" ? "default" : "outline",
      onClick: () =>
        setPending({ kind: "change", plan: target, interval, direction }),
    };
  }

  function priceFor(cardPlan: OrgPlan) {
    const prices = PLAN_PRICES_EUR[cardPlan];
    if (cardPlan === "free" || prices.monthly === 0) {
      return { monthlyEquivalent: 0, annualTotal: 0 };
    }
    const annualTotal = prices.annual;
    const monthlyEquivalent =
      interval === "annual" ? Math.round(prices.annual / 12) : prices.monthly;
    return { monthlyEquivalent, annualTotal };
  }

  const statusLabel = (() => {
    if (plan === "free") return t("status.free");
    if (cancelAtPeriodEnd && billingPeriodEnd)
      return t("status.cancels", { date: fmtDate(billingPeriodEnd) });
    return t("status.active");
  })();

  const confirmCopy = (() => {
    if (!pending) return null;
    if (pending.kind === "cancel") {
      return {
        title: t("confirm.cancelTitle"),
        body: billingPeriodEnd
          ? t("confirm.cancelBody", {
              plan: t(`plans.${plan}`),
              date: fmtDate(billingPeriodEnd),
            })
          : t("confirm.cancelBodyNoDate", { plan: t(`plans.${plan}`) }),
        confirm: t("confirm.cancelConfirm"),
        cancel: t("confirm.keep"),
        variant: "destructive" as const,
        onConfirm: runCancel,
      };
    }
    const planName = t(`plans.${pending.plan}`);
    const intervalName = t(`interval.${pending.interval}`);
    return {
      title: t("confirm.changeTitle", { plan: planName }),
      body:
        pending.direction === "downgrade"
          ? t("confirm.downgradeBody", { plan: planName, interval: intervalName })
          : t("confirm.upgradeBody", { plan: planName, interval: intervalName }),
      confirm: t("confirm.confirm"),
      cancel: t("confirm.cancelAction"),
      variant: "default" as const,
      onConfirm: () => runChange(pending.plan, pending.interval),
    };
  })();

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="rounded-md bg-muted px-4 py-3 text-center text-p3 text-muted-foreground">
          {t("readOnly")}
        </div>
      )}

      {/* Current plan — accent summary panel */}
      <div
        className="overflow-hidden rounded-md"
        style={{
          background: "linear-gradient(135deg, var(--accent-2), var(--accent))",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-l6-plus text-white/80">{t("currentPlan")}</p>
            <p className="mt-1 text-h3 tracking-tight text-white">
              {t(`plans.${plan}`)}
            </p>
            <p className="mt-1.5 text-p4 text-white/90">{statusLabel}</p>
            {plan !== "free" && billingPeriodEnd && !cancelAtPeriodEnd && (
              <p className="mt-0.5 text-p4 text-white/90">
                {t("nextBillingDate", { date: fmtDate(billingPeriodEnd) })}
              </p>
            )}
          </div>
          {isAdmin && hasCustomer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManage}
              disabled={redirecting}
            >
              <Icon name="DocumentText" size={16} />
              {redirecting ? t("redirecting") : t("actions.manage")}
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation notice */}
      {cancelAtPeriodEnd && billingPeriodEnd && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-p3 text-warning">
            {t("cancelBanner.body", {
              plan: t(`plans.${plan}`),
              date: fmtDate(billingPeriodEnd),
            })}
          </p>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={runResume}
              disabled={isPending}
            >
              {t("actions.resume")}
            </Button>
          )}
        </div>
      )}

      {/* Interval toggle */}
      <div
        role="group"
        aria-label={t("intervalLabel")}
        className="flex items-center justify-center gap-1 rounded-md border border-border bg-card p-1 sm:w-fit"
      >
        {(["monthly", "annual"] as Interval[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setIntervalState(opt)}
            aria-pressed={interval === opt}
            className={cn(
              "rounded-sm px-4 py-1.5 text-l6 transition-colors",
              interval === opt
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`interval.${opt}`)}
            {opt === "annual" && (
              <span className="ml-1.5 text-l6-plus opacity-80">
                {t("interval.save")}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((cardPlan) => {
          const isCurrent = cardPlan === plan;
          const isPro = cardPlan === "professional";
          const { monthlyEquivalent, annualTotal } = priceFor(cardPlan);
          const action = cardAction(cardPlan);

          const features: string[] = [];
          for (let i = 1; i <= 3; i++) {
            const key = `plans.${cardPlan}.features.f${i}`;
            if (tp.has(key)) features.push(tp(key));
          }

          return (
            <div
              key={cardPlan}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-card p-4",
                isCurrent ? "border-2 border-primary" : "border border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-h4 text-foreground">
                  {t(`plans.${cardPlan}`)}
                </h3>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-primary">
                    {t("currentPlanBadge")}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-4xl font-extrabold",
                    isPro ? "text-primary" : "text-foreground",
                  )}
                >
                  {formatPrice(monthlyEquivalent, currency)}
                </span>
                <span className="text-p4 text-muted-foreground">
                  /{t("perMonth")}
                </span>
              </div>
              {interval === "annual" && annualTotal > 0 ? (
                <p className="mt-0.5 text-p4-r text-muted-foreground">
                  {t("billedAnnually", {
                    total: formatPrice(annualTotal, currency),
                  })}
                </p>
              ) : (
                <p className="mt-0.5 text-p4-r text-transparent">.</p>
              )}

              {features.length > 0 && (
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-p4 text-muted-foreground">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Icon
                        name="TickCircle"
                        size={14}
                        variant="Bold"
                        className="mt-0.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5">
                {action && "currentBadge" in action ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    {t("currentPlanBadge")}
                  </Button>
                ) : action ? (
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="w-full"
                    onClick={action.onClick}
                    disabled={isPending || redirecting}
                  >
                    {action.label}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Boost add-on — only for purchasable plans with a live subscription */}
      {canBuyAiBoost(plan) && hasSubscription && (
        <div
          className={cn(
            "flex flex-col gap-4 rounded-md p-5 sm:flex-row sm:items-center sm:justify-between",
            aiBoost
              ? "border-2 border-primary bg-primary/5"
              : "border border-border bg-card",
          )}
        >
          <div className="flex items-start gap-3">
            <Icon
              name="Flash"
              size={20}
              variant="Bold"
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-h4 text-foreground">{t("aiBoost.title")}</h3>
                {aiBoost && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-primary">
                    {t("aiBoost.activeBadge")}
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-prose text-p4 text-muted-foreground">
                {t("aiBoost.description", { messages: AI_BOOST_BONUS_MESSAGES })}
              </p>
              <p className="mt-1.5 text-p4 text-foreground">
                {t("aiBoost.price", {
                  price: formatPrice(AI_BOOST_PRICE.monthly, currency),
                })}
                {currentInterval === "annual" && (
                  <span className="text-muted-foreground">
                    {" "}
                    {t("aiBoost.annualNote", {
                      total: formatPrice(AI_BOOST_PRICE.annual, currency),
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant={aiBoost ? "outline" : "default"}
              size="sm"
              className="shrink-0"
              onClick={aiBoost ? runRemoveBoost : runAddBoost}
              disabled={isPending || redirecting}
            >
              {aiBoost ? t("aiBoost.remove") : t("aiBoost.add")}
            </Button>
          )}
        </div>
      )}

      {/* Footer actions */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Link href="/contact">
            <Button variant="ghost" size="sm">
              {t("actions.contactEnterprise")}
            </Button>
          </Link>
          {hasSubscription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={runResync}
              disabled={isPending}
              title={t("resyncHint")}
            >
              <Icon name="Refresh" size={14} />
              {t("actions.resync")}
            </Button>
          )}
        </div>
      )}

      {confirmCopy && (
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(o) => !o && setPending(null)}
          title={confirmCopy.title}
          description={confirmCopy.body}
          confirmLabel={confirmCopy.confirm}
          cancelLabel={confirmCopy.cancel}
          variant={confirmCopy.variant}
          disabled={isPending}
          onConfirm={confirmCopy.onConfirm}
        />
      )}
    </div>
  );
}
