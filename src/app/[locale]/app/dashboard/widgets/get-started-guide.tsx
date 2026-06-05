"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import { AskSeentrixAI } from "@/components/copilot/ask-seentrix-ai";
import { cn } from "@/lib/utils";
import type { OnboardingState, OnboardingStep } from "@/lib/onboarding-state";

/**
 * GetStartedGuide — the dashboard "next steps" surface shown to a brand-new
 * organisation that has no products yet. Instead of an empty dashboard full of
 * zero-value widgets, new customers (who usually don't know what the CRA
 * requires) get a guided, ordered checklist with a clear primary action and a
 * link to ask the Copilot.
 *
 * The checklist is strictly sequential: completed steps are ticked, the single
 * current step is highlighted and clickable, and every later step is locked
 * (greyed out, not clickable) so the user can't jump ahead into a flow that
 * doesn't make sense yet. Driven entirely by `getOnboardingState()` so the
 * order, done-flags and progress match what the Copilot sees.
 */

interface Props {
  state: OnboardingState;
  firstName: string | null;
}

export function GetStartedGuide({ state, firstName }: Props) {
  const t = useTranslations("dashboard");
  const next = state.nextStep;

  // Build the "add product" href so the global create-product side sheet opens
  // over the *current* page (dashboard) instead of navigating to /app/products.
  // The sheet (mounted in app/layout.tsx) drives itself off `?new=product`.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sheetHref = useSheetHref(pathname, searchParams);

  // Resolve a step's effective href: the first-product step opens the side
  // sheet over the dashboard; everything else uses its declared in-app path.
  const hrefFor = (step: OnboardingStep) =>
    step.id === "first-product" ? sheetHref : step.href;

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

      {/* Progress card. No CTA button here — the active step in the checklist
          below is the single, unambiguous call to action, so a duplicate
          "add product" button would just be noise. */}
      <div className="flex flex-col gap-2 rounded-md bg-card p-6 shadow-card-md">
        <p className="text-h4 text-foreground">
          {t("getStarted.progressLabel", {
            done: state.completedCount,
            total: state.totalCount,
          })}
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
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

      {/* Step checklist — strictly sequential */}
      <ol className="flex flex-col gap-3">
        {state.steps.map((step, idx) => {
          const isNext = !step.done && step.id === next?.id;
          // A step is "locked" when it's neither done nor the current step.
          const locked = !step.done && !isNext;
          return (
            <StepRow
              key={step.id}
              step={step}
              href={hrefFor(step)}
              index={idx + 1}
              isNext={isNext}
              locked={locked}
              t={t}
            />
          );
        })}
      </ol>

      {/* Ask-the-Copilot helper — a real button that opens the AI drawer with a
          pre-seeded "what do I do next?" question. */}
      <AskSeentrixAI
        variant="banner"
        seed="I just set up my company in Seentrix. What do I need to do next to get started with CRA compliance?"
        label={t("getStarted.askTitle")}
        sublabel={t("getStarted.askDescription")}
      />
    </div>
  );
}

/** Append `?new=product` to the current path (preserving existing params). */
function useSheetHref(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
): string {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.set("new", "product");
  return `${pathname}?${params.toString()}`;
}

function StepRow({
  step,
  href,
  index,
  isNext,
  locked,
  t,
}: {
  step: OnboardingStep;
  href: string;
  index: number;
  isNext: boolean;
  locked: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const title = t(`steps.${step.id_key}.title`);
  const description = t(`steps.${step.id_key}.description`);

  const content = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-md bg-card px-5 py-4 shadow-card-sm transition-colors",
        isNext && "ring-2 ring-primary/40",
        isNext && "hover:bg-muted/40",
        locked && "opacity-55",
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
        ) : locked ? (
          <Icon name="lock-password-stroke-rounded" size={18} />
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
              step.done || locked ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </p>
        </div>
        <p className="text-p3 text-muted-foreground">{description}</p>
      </div>

      {isNext && (
        <Icon
          name="ArrowRight2"
          size={18}
          className="shrink-0 text-muted-foreground"
        />
      )}
    </div>
  );

  // Only the single current step is interactive. Done steps and locked future
  // steps render as static rows so the user can't jump ahead.
  if (!isNext) {
    return <li>{content}</li>;
  }
  return (
    <li>
      <CtaLink href={href} className="block outline-none">
        {content}
      </CtaLink>
    </li>
  );
}

/**
 * Link that uses a plain `<a>` when the target carries a query string (so the
 * `?new=product` sheet param survives the navigation), and the typed next-intl
 * `<Link>` otherwise.
 */
function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.includes("?")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
