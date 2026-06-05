"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingState, OnboardingStep } from "@/lib/onboarding-state";

/**
 * GetStartedGuide — the dashboard "next steps" surface shown to a brand-new
 * organisation that has no products yet. Instead of an empty dashboard full of
 * zero-value widgets, new customers (who usually don't know what the CRA
 * requires) get a guided, ordered checklist with a clear primary action and a
 * link to ask the Copilot.
 *
 * Driven entirely by `getOnboardingState()` so the step order, done-flags and
 * progress here are identical to what the Copilot sees.
 */

interface Props {
  state: OnboardingState;
  firstName: string | null;
}

export function GetStartedGuide({ state, firstName }: Props) {
  const t = useTranslations("dashboard");
  const next = state.nextStep;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">
          {firstName
            ? t("getStarted.greeting", { name: firstName })
            : t("getStarted.title")}
        </h1>
        <p className="text-p2 text-muted-foreground">
          {t("getStarted.subtitle")}
        </p>
      </div>

      {/* Progress + primary CTA card */}
      <div className="flex flex-col gap-4 rounded-md bg-card p-6 shadow-card-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-h4 text-foreground">
            {t("getStarted.progressLabel", {
              done: state.completedCount,
              total: state.totalCount,
            })}
          </p>
          <div
            className="h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={state.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
        {next && (
          <a
            href={next.href}
            className={cn(buttonVariants(), "shrink-0 self-start sm:self-auto")}
          >
            {t(`steps.${next.id_key}.cta`)}
            <Icon name="ArrowRight2" size={16} />
          </a>
        )}
      </div>

      {/* Step checklist */}
      <ol className="flex flex-col gap-3">
        {state.steps.map((step, idx) => (
          <StepRow
            key={step.id}
            step={step}
            index={idx + 1}
            isNext={!step.done && step.id === next?.id}
            t={t}
          />
        ))}
      </ol>

      {/* Ask-the-Copilot helper */}
      <div className="flex items-center gap-3 rounded-md border border-dashed border-border-outline bg-muted/40 px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon name="ai-magic-stroke-rounded" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-h6 text-foreground">{t("getStarted.askTitle")}</p>
          <p className="text-p3 text-muted-foreground">
            {t("getStarted.askDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepRow({
  step,
  index,
  isNext,
  t,
}: {
  step: OnboardingStep;
  index: number;
  isNext: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const title = t(`steps.${step.id_key}.title`);
  const description = t(`steps.${step.id_key}.description`);

  const content = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-md bg-card px-5 py-4 shadow-card-sm transition-colors",
        isNext && "ring-2 ring-primary/40",
        !step.done && "hover:bg-muted/40",
      )}
    >
      {/* Status badge */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          step.done
            ? "bg-success/10 text-success"
            : isNext
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {step.done ? (
          <Icon name="TickCircle" size={20} variant="Bold" />
        ) : (
          <Icon name={step.icon} size={20} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-p4 font-semibold uppercase tracking-wider text-muted-foreground">
            {index}
          </span>
          <p
            className={cn(
              "truncate text-h6",
              step.done ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </p>
        </div>
        <p className="text-p3 text-muted-foreground">{description}</p>
      </div>

      {!step.done && (
        <Icon
          name="ArrowRight2"
          size={18}
          className="shrink-0 text-muted-foreground"
        />
      )}
    </div>
  );

  // Completed steps are not clickable (nothing to do); outstanding steps link
  // to their action. We use a plain <a> for the `?new=product` deep-link so the
  // global create-product sheet query param survives, and the typed <Link>
  // otherwise.
  if (step.done) {
    return <li>{content}</li>;
  }
  return (
    <li>
      {step.href.includes("?") ? (
        <a href={step.href} className="block outline-none">
          {content}
        </a>
      ) : (
        <Link href={step.href} className="block outline-none">
          {content}
        </Link>
      )}
    </li>
  );
}
