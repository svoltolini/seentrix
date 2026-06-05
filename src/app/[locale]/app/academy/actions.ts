"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  QUIZ_COOLDOWN_MINUTES,
  QUIZ_PASS_THRESHOLD,
} from "@/lib/academy/types";
import { getLesson } from "@/lib/academy/lessons";
import type { LocaleId } from "@/lib/academy/types";
import { logActivity } from "@/lib/activity";

export type QuizSubmission = {
  lessonId: string;
  /** Answers indexed by question position; value is the option index chosen. */
  answers: number[];
};

export type QuizResult =
  | {
      status: "passed";
      score: number;
      certificateHash: string;
    }
  | {
      status: "failed";
      score: number;
      cooldownUntil: string;
    }
  | {
      status: "cooldown";
      cooldownUntil: string;
    }
  | { status: "error"; error: string };

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null };
  const orgId =
    (user.app_metadata?.org_id as string | undefined) ?? null;
  return { supabase, user, orgId };
}

/**
 * Evaluate a quiz submission, record the attempt, and — if the score
 * passes — record completion and clear must_complete_training if every
 * required lesson for the user's role is now done.
 */
export async function submitQuiz(
  submission: QuizSubmission,
): Promise<QuizResult> {
  const { supabase, user, orgId } = await getContext();
  if (!user || !orgId) return { status: "error", error: "notAuthenticated" };

  const lesson = getLesson(submission.lessonId);
  if (!lesson) return { status: "error", error: "unknownLesson" };

  // Pick the English quiz for scoring — quiz structure (correctIndex) is
  // locale-invariant, we only translate the text. Both locales score the
  // same answers the same way.
  const quiz = lesson.i18n.en.quiz;

  // Cooldown check — read the most recent attempt timestamp for this
  // (user, lesson) pair and reject if it's still within the window.
  const { data: latestAttempt } = await supabase
    .from("academy_quiz_attempts")
    .select("attempted_at, passed")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestAttempt && !latestAttempt.passed) {
    const lastAt = new Date(
      (latestAttempt as { attempted_at: string }).attempted_at,
    ).getTime();
    const cooldownEnd = lastAt + QUIZ_COOLDOWN_MINUTES * 60_000;
    if (cooldownEnd > Date.now()) {
      return {
        status: "cooldown",
        cooldownUntil: new Date(cooldownEnd).toISOString(),
      };
    }
  }

  // Score the submission.
  if (submission.answers.length !== quiz.length) {
    return { status: "error", error: "invalidSubmission" };
  }
  let correct = 0;
  for (let i = 0; i < quiz.length; i++) {
    if (submission.answers[i] === quiz[i].correctIndex) correct++;
  }
  const score = correct / quiz.length;
  const passed = score >= QUIZ_PASS_THRESHOLD;

  // Always log the attempt, pass or fail.
  const { error: attemptError } = await supabase
    .from("academy_quiz_attempts")
    .insert({
      user_id: user.id,
      org_id: orgId,
      lesson_id: lesson.id,
      score,
      passed,
      answers: submission.answers,
    });
  if (attemptError) return { status: "error", error: "generic" };

  if (!passed) {
    const cooldownUntil = new Date(
      Date.now() + QUIZ_COOLDOWN_MINUTES * 60_000,
    ).toISOString();
    return { status: "failed", score, cooldownUntil };
  }

  // Passed. Upsert completion and issue a certificate hash.
  const certificateHash = createHash("sha256")
    .update(
      [
        user.id,
        lesson.id,
        score.toFixed(2),
        new Date().toISOString(),
        orgId,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 32);

  const { error: upsertError } = await supabase
    .from("academy_completions")
    .upsert(
      {
        user_id: user.id,
        org_id: orgId,
        lesson_id: lesson.id,
        score,
        completed_at: new Date().toISOString(),
        certificate_hash: certificateHash,
      },
      { onConflict: "user_id,lesson_id" },
    );
  if (upsertError) return { status: "error", error: "generic" };

  await logActivity({
    action: "academy.lesson_completed",
    targetType: "academy_lesson",
    targetId: lesson.id,
    metadata: { score },
  });

  // If every required lesson for this user's role is now completed, clear
  // the must_complete_training flag so the middleware lets them into the
  // rest of the app.
  await maybeClearTrainingGate(supabase, user.id);

  revalidatePath("/app/academy");
  return { status: "passed", score, certificateHash };
}

/**
 * Check whether the caller has now completed every lesson required for
 * their role. If so, call the SECURITY DEFINER helper to clear the gate.
 */
async function maybeClearTrainingGate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { requiredLessonsForRole } = await import("@/lib/academy/lessons");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  const role = (userRow as { role: string } | null)?.role;
  if (!role) return;

  const required = requiredLessonsForRole(role as Parameters<typeof requiredLessonsForRole>[0]);
  if (required.length === 0) return;

  const { data: completions } = await supabase
    .from("academy_completions")
    .select("lesson_id")
    .eq("user_id", userId);
  const done = new Set(
    (completions ?? []).map((c) => (c as { lesson_id: string }).lesson_id),
  );

  const allDone = required.every((id) => done.has(id));
  if (!allDone) return;

  await supabase.rpc("clear_must_complete_training");
}

/**
 * List the caller's completions. Used by the Academy hub to paint ✓ marks
 * on lesson cards.
 */
export async function listMyCompletions(): Promise<{
  completions: Array<{ lesson_id: string; completed_at: string; score: number }>;
}> {
  const { supabase, user } = await getContext();
  if (!user) return { completions: [] };
  const { data } = await supabase
    .from("academy_completions")
    .select("lesson_id, completed_at, score")
    .eq("user_id", user.id);
  return {
    completions: (data ?? []) as Array<{
      lesson_id: string;
      completed_at: string;
      score: number;
    }>,
  };
}

// ---------------------------------------------------------------------------
// Certificate verification
// ---------------------------------------------------------------------------

export type CertificateVerification =
  | {
      status: "valid";
      holderName: string;
      holderEmail: string;
      lessonTitle: string;
      score: number;
      completedAt: string;
      certificateHash: string;
    }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "error" };

/**
 * Verify an Academy certificate by its hash. Admins / compliance officers can
 * paste a certificate number to confirm it's genuine and see who it belongs
 * to. The lookup is scoped to the verifier's own organisation — you can never
 * resolve a certificate from another org — and uses the service-role client so
 * an admin can read teammates' completion rows (RLS otherwise scopes reads to
 * the caller's own rows).
 */
export async function verifyCertificate(
  rawHash: string,
  locale: LocaleId,
): Promise<CertificateVerification> {
  const { user, orgId } = await getContext();
  if (!user || !orgId) return { status: "forbidden" };

  // Only admins and compliance officers may verify certificates.
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (me as { role: string } | null)?.role;
  if (role !== "admin" && role !== "compliance_officer") {
    return { status: "forbidden" };
  }

  // Normalise the pasted value: trim, strip a trailing ellipsis the UI shows,
  // and lower-case (the hash is hex). We match by prefix so the truncated
  // 16-char display value or the full 32-char hash both resolve.
  const hash = rawHash.trim().replace(/[…\.\s]+$/, "").toLowerCase();
  if (hash.length < 8) return { status: "not_found" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("academy_completions")
    .select("user_id, lesson_id, score, completed_at, certificate_hash, org_id")
    .eq("org_id", orgId)
    .ilike("certificate_hash", `${hash}%`)
    .limit(2);
  if (error) return { status: "error" };
  if (!data || data.length === 0) return { status: "not_found" };

  const row = data[0] as {
    user_id: string;
    lesson_id: string;
    score: number;
    completed_at: string;
    certificate_hash: string;
  };

  const { data: holder } = await admin
    .from("users")
    .select("full_name, email")
    .eq("id", row.user_id)
    .single();
  const h = (holder as { full_name: string | null; email: string } | null) ?? null;

  const lesson = getLesson(row.lesson_id);
  const lessonTitle =
    lesson?.i18n[locale]?.title ?? lesson?.i18n.en?.title ?? row.lesson_id;

  return {
    status: "valid",
    holderName: h?.full_name ?? h?.email ?? "Unknown",
    holderEmail: h?.email ?? "",
    lessonTitle,
    score: row.score,
    completedAt: row.completed_at,
    certificateHash: row.certificate_hash,
  };
}
