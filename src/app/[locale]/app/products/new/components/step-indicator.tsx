"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const isLast = i === steps.length - 1;

          return (
            <li
              key={i}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full text-l6-plus transition-all duration-200",
                    isCompleted &&
                      "bg-primary text-primary-foreground",
                    isActive &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !isCompleted &&
                      !isActive &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Icon name="CheckIcon" className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-p4 leading-tight sm:block",
                    isActive
                      ? "text-l6 text-foreground"
                      : isCompleted
                        ? "text-l6 text-muted-foreground"
                        : "text-l6 text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-2 mb-5 hidden h-0.5 flex-1 sm:block">
                  <div
                    className={cn(
                      "h-full rounded-full transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
