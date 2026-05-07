"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { QuizQuestion } from "@/lib/academy/types";
import { QUIZ_PASS_THRESHOLD } from "@/lib/academy/types";
import { submitQuiz } from "../actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

type Outcome =
  | { kind: "idle" }
  | { kind: "in_review"; correctCount: number; totalCount: number }
  | { kind: "passed"; score: number; certificateHash: string }
  | { kind: "failed"; score: number; cooldownUntil: string }
  | { kind: "cooldown"; cooldownUntil: string };

/**
 * Quiz — renders 5 multiple-choice questions, lets the learner pick one
 * answer per question, grades locally for instant feedback, then submits
 * to the server for audit-trail recording. On pass, the page refreshes so
 * the lesson shows its completed state.
 */
export function Quiz({
  lessonId,
  questions,
}: {
  lessonId: string;
  questions: QuizQuestion[];
}) {
  const t = useTranslations("academy.quiz");
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [isSubmitting, startTransition] = useTransition();

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  function handleSubmit() {
    const ordered = questions.map((_, i) => answers[i]);
    // Local scoring so the learner gets instant per-question feedback while
    // the server call finishes. The server re-scores authoritatively.
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (ordered[i] === questions[i].correctIndex) correct++;
    }
    setOutcome({
      kind: "in_review",
      correctCount: correct,
      totalCount: questions.length,
    });

    startTransition(async () => {
      const result = await submitQuiz({ lessonId, answers: ordered });
      if (result.status === "passed") {
        setOutcome({
          kind: "passed",
          score: result.score,
          certificateHash: result.certificateHash,
        });
        router.refresh();
      } else if (result.status === "failed") {
        setOutcome({
          kind: "failed",
          score: result.score,
          cooldownUntil: result.cooldownUntil,
        });
      } else if (result.status === "cooldown") {
        setOutcome({ kind: "cooldown", cooldownUntil: result.cooldownUntil });
      }
    });
  }

  if (outcome.kind === "passed") {
    return (
      <div
        className="overflow-hidden rounded-md bg-cover bg-center p-8"
        style={{ backgroundImage: "url('/images/entity-role-bg.svg')" }}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <Icon name="checkmark-circle-01-stroke-rounded" size={24} className="text-white" />
        </div>
        <h3 className="mt-4 text-h3 text-white">
          {t("passedTitle")}
        </h3>
        <p className="mt-2 text-sm text-white">
          {t("passedBody", { score: Math.round(outcome.score * 100) })}
        </p>
        <p className="mt-3 font-mono text-[11px] text-white">
          {t("certificateLabel")}: {outcome.certificateHash.slice(0, 16)}…
        </p>
      </div>
    );
  }

  const isLocked =
    outcome.kind === "failed" || outcome.kind === "cooldown";

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={q}
          selected={answers[i]}
          locked={outcome.kind !== "idle"}
          revealCorrect={outcome.kind !== "idle"}
          onSelect={(choice) =>
            setAnswers((prev) => ({ ...prev, [i]: choice }))
          }
        />
      ))}

      {outcome.kind === "idle" && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-5 py-4">
          <p className="text-xs text-muted-foreground">
            {t("threshold", { percent: Math.round(QUIZ_PASS_THRESHOLD * 100) })}
          </p>
          <Button
            size="sm"
            disabled={!allAnswered || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      )}

      {outcome.kind === "failed" && (
        <div className="rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 p-5">
          <p className="font-heading text-sm font-semibold text-[#DC2626]">
            {t("failedTitle", {
              score: Math.round(outcome.score * 100),
              threshold: Math.round(QUIZ_PASS_THRESHOLD * 100),
            })}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("failedBody", {
              minutes: minutesUntil(outcome.cooldownUntil),
            })}
          </p>
        </div>
      )}

      {outcome.kind === "cooldown" && (
        <div className="rounded-xl border border-[#D97706]/30 bg-[#D97706]/10 p-5">
          <p className="font-heading text-sm font-semibold text-[#D97706]">
            {t("cooldownTitle")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("cooldownBody", {
              minutes: minutesUntil(outcome.cooldownUntil),
            })}
          </p>
        </div>
      )}

      {isLocked && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAnswers({});
            setOutcome({ kind: "idle" });
          }}
          disabled={minutesUntil(
            outcome.kind === "failed" || outcome.kind === "cooldown"
              ? outcome.cooldownUntil
              : new Date().toISOString(),
          ) > 0}
        >
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  locked,
  revealCorrect,
  onSelect,
}: {
  index: number;
  question: QuizQuestion;
  selected: number | undefined;
  locked: boolean;
  revealCorrect: boolean;
  onSelect: (choice: number) => void;
}) {
  const tCard = useTranslations("academy.quiz");
  const legendId = `quiz-q${index}-legend`;
  return (
    <fieldset
      disabled={locked}
      aria-labelledby={legendId}
      className="rounded-xl bg-muted p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {tCard("questionPrefix")}
        {index + 1}
      </p>
      <legend id={legendId} className="mt-1 text-sm font-semibold text-foreground">
        {question.question}
      </legend>
      <div className="mt-4 space-y-2" role="radiogroup">
        {question.options.map((opt, j) => {
          const isSelected = selected === j;
          const isCorrect = j === question.correctIndex;
          const showCorrect = revealCorrect && isCorrect;
          const showWrong = revealCorrect && isSelected && !isCorrect;
          return (
            <button
              key={j}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={locked}
              onClick={() => onSelect(j)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition-colors",
                !revealCorrect && isSelected && "border-primary bg-primary/10",
                !revealCorrect && !isSelected && "border-border hover:border-border",
                showCorrect && "border-[#16A34A]/50 bg-[#16A34A]/10",
                showWrong && "border-[#DC2626]/50 bg-[#DC2626]/10",
                locked && !showCorrect && !showWrong && "opacity-40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/40",
                  showCorrect && "border-[#16A34A] bg-[#16A34A] text-white",
                  showWrong && "border-[#DC2626] bg-[#DC2626] text-white",
                )}
              >
                {(isSelected || showCorrect) && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
      {revealCorrect && (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {question.explanation}
        </p>
      )}
    </fieldset>
  );
}

function minutesUntil(iso: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000),
  );
}
