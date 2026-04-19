import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allLessonIds, requiredLessonsForRole } from "@/lib/academy/lessons";
import type { RoleId } from "@/lib/academy/types";

/**
 * Team Progress CSV export. Admins + compliance officers get a flat CSV of
 * every member's completion status per lesson — the artefact to hand a
 * regulator when they ask \u201Chow do you train your team?\u201D
 *
 * Not cached (Cache-Control: no-store) — audit reports must reflect the
 * live state at the moment of export.
 */

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: RoleId;
};

type CompletionRow = {
  user_id: string;
  lesson_id: string;
  score: number;
  completed_at: string;
};

function csvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  // Minimal RFC 4180 escaping: wrap in quotes if it contains comma/quote/CR/LF
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: callerRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const callerRole = (callerRow as { role: string } | null)?.role ?? "";
  if (callerRole !== "admin" && callerRole !== "compliance_officer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [{ data: members }, { data: completions }, { data: org }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, role")
        .order("created_at", { ascending: true }),
      supabase
        .from("academy_completions")
        .select("user_id, lesson_id, score, completed_at"),
      supabase
        .from("organizations")
        .select("name, legal_name")
        .eq(
          "id",
          (user.app_metadata?.org_id as string | undefined) ?? "",
        )
        .single(),
    ]);

  const memberList = (members ?? []) as TeamMember[];
  const completionsByUser = new Map<string, Map<string, CompletionRow>>();
  for (const row of (completions ?? []) as CompletionRow[]) {
    if (!completionsByUser.has(row.user_id))
      completionsByUser.set(row.user_id, new Map());
    completionsByUser.get(row.user_id)!.set(row.lesson_id, row);
  }

  const lessonIds = allLessonIds();
  const lessonHeaders = lessonIds.flatMap((id) => [
    `${id}_status`,
    `${id}_score`,
    `${id}_completed_at`,
  ]);

  const header = [
    "member_name",
    "member_email",
    "role",
    "required_lesson_count",
    "completed_lesson_count",
    "completion_percent",
    ...lessonHeaders,
  ];

  const rows: string[] = [header.map(csvCell).join(",")];

  for (const member of memberList) {
    const required = requiredLessonsForRole(member.role);
    const memberCompletions = completionsByUser.get(member.id) ?? new Map();
    const doneCount = required.filter((id) => memberCompletions.has(id))
      .length;
    const pct =
      required.length > 0
        ? Math.round((doneCount / required.length) * 100)
        : 0;

    const row: unknown[] = [
      member.full_name ?? "",
      member.email,
      member.role,
      required.length,
      doneCount,
      `${pct}%`,
    ];

    for (const lessonId of lessonIds) {
      const completion = memberCompletions.get(lessonId);
      const isRequired = required.includes(lessonId);
      if (completion) {
        row.push("completed");
        row.push(`${Math.round(completion.score * 100)}%`);
        row.push(completion.completed_at);
      } else {
        row.push(isRequired ? "required" : "n/a");
        row.push("");
        row.push("");
      }
    }

    rows.push(row.map(csvCell).join(","));
  }

  const orgName =
    ((org as { legal_name: string | null; name: string } | null)
      ?.legal_name ||
      (org as { name: string } | null)?.name) ??
    "seentrix";
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const date = new Date().toISOString().slice(0, 10);

  const body = "\uFEFF" + rows.join("\r\n") + "\r\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="team-training-${slug}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
