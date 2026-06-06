"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { QuizQuestion } from "@/lib/academy/types";
import { QUIZ_PASS_THRESHOLD } from "@/lib/academy/types";
import { submitQuiz } from "../actions";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
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
  alreadyPassed = false,
  passedScore,
}: {
  lessonId: string;
  questions: QuizQuestion[];
  /** True when the learner has already passed this lesson — lock the quiz. */
  alreadyPassed?: boolean;
  /** Their recorded score (0..1), shown on the locked pass card. */
  passedScore?: number;
}) {
  const t = useTranslations("academy.quiz");
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [isSubmitting, startTransition] = useTransition();
  // Anchor for the post-submit result so we can settle the viewport on it
  // instead of leaving the user stranded mid-page when the long question list
  // collapses into a short result card (which previously made the scroll jump
  // around wildly).
  const resultRef = useRef<HTMLDivElement>(null);

  const answeredCount = questions.filter(
    (_, i) => answers[i] !== undefined,
  ).length;
  const allAnswered = answeredCount === questions.length;

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

  // Only the PASSED outcome reshapes the page (the whole question list is
  // replaced by a short card), which can leave the viewport stranded. Bring
  // that card into view with a minimal `nearest` nudge. The failed/cooldown
  // results render right below the (still-visible) questions where the submit
  // button already was, so they need NO scroll — auto-scrolling them was what
  // made the page feel like it was jumping around.
  useEffect(() => {
    if (outcome.kind === "passed") {
      const id = requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [outcome.kind]);

  // Once a lesson is passed it stays passed — the quiz is locked into a
  // read-only "you passed" card and can't be retaken. (CRA training is
  // pass-once; re-taking would muddy the audit trail.) This check sits AFTER
  // all hooks so hook order stays stable across renders.
  if (alreadyPassed) {
    return (
      <PassedCard
        score={typeof passedScore === "number" ? passedScore : null}
        t={t}
      />
    );
  }

  if (outcome.kind === "passed") {
    return (
      <div ref={resultRef}>
        <PassedCard score={outcome.score} t={t} />
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
        <div className="flex flex-col gap-3 rounded-md bg-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-p3 text-muted-foreground">
              {t("threshold", {
                percent: Math.round(QUIZ_PASS_THRESHOLD * 100),
              })}
            </p>
            {/* Answered-progress bar so the learner sees how many remain. */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-p4 tabular-nums text-muted-foreground">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!allAnswered || isSubmitting}
            onClick={handleSubmit}
            className="shrink-0"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      )}

      {outcome.kind === "failed" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-l5 text-destructive">
            {t("failedTitle", {
              score: Math.round(outcome.score * 100),
              threshold: Math.round(QUIZ_PASS_THRESHOLD * 100),
            })}
          </p>
          <p className="mt-2 text-p3 text-muted-foreground">
            {t("failedBody", {
              minutes: minutesUntil(outcome.cooldownUntil),
            })}
          </p>
        </div>
      )}

      {outcome.kind === "cooldown" && (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-5">
          <p className="text-l5 text-warning">
            {t("cooldownTitle")}
          </p>
          <p className="mt-2 text-p3 text-muted-foreground">
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

/**
 * PassedCard — clean white "you passed" card matching the lesson audio card
 * (rounded-md bg-card shadow + small primary pill). Full-width, no certificate
 * code (the downloadable certificate lives in the completion row above).
 */
function PassedCard({
  score,
  t,
}: {
  score: number | null;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex w-full items-start gap-4 rounded-md bg-card p-5 shadow-card-md">
      <IconBadge
        name="checkmark-circle-01-stroke-rounded"
        tone="success"
        size="lg"
        shape="circle"
        iconSize={22}
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-h5 text-foreground">{t("passedTitle")}</h3>
        <p className="mt-1 text-p3 text-muted-foreground">
          {typeof score === "number"
            ? t("passedBody", { score: Math.round(score * 100) })
            : t("alreadyPassedShort")}
        </p>
      </div>
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
  return (
    <fieldset
      disabled={locked}
      className="rounded-md bg-card p-5 shadow-card-sm"
    >
      {/* Native <legend> renders on the fieldset border edge, which made the
          question text sit on top of the card border. We hide a semantic
          legend for screen readers and render the visible prompt as ordinary
          flow content inside the padding box. */}
      <legend className="sr-only">
        {tCard("questionPrefix")}
        {index + 1}: {question.question}
      </legend>
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {tCard("questionPrefix")}
        {index + 1}
      </p>
      <p className="mt-1 text-h5 text-foreground">{question.question}</p>
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
                "flex w-full items-start gap-3 rounded-sm border-[1.5px] px-4 py-3 text-left text-p3 transition-colors",
                !revealCorrect && isSelected && "border-primary bg-primary/10",
                !revealCorrect && !isSelected && "border-border-outline bg-card hover:border-primary",
                showCorrect && "border-success/50 bg-success/10",
                showWrong && "border-destructive/50 bg-destructive/10",
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
                  showCorrect && "border-success bg-success text-white",
                  showWrong && "border-destructive bg-destructive text-white",
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
        <p className="mt-3 rounded-sm bg-muted px-3 py-2 text-p3 leading-relaxed text-muted-foreground">
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
