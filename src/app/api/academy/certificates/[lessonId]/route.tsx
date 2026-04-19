import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getLesson, getLessonContent } from "@/lib/academy/lessons";
import { AcademyCertificatePdf } from "@/lib/pdf/templates/academy-certificate";
import type { LocaleId } from "@/lib/academy/types";

/**
 * Stream a one-page PDF certificate of completion for a lesson the caller
 * has passed. The SHA-256 hash printed on the certificate matches the
 * academy_completions.certificate_hash column — that's the anti-tamper
 * identifier auditors can verify against the DB.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? "";
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lesson = getLesson(lessonId);
  if (!lesson) {
    return NextResponse.json({ error: "unknown_lesson" }, { status: 404 });
  }

  const [{ data: completion }, { data: userRow }, { data: orgRow }] =
    await Promise.all([
      supabase
        .from("academy_completions")
        .select("score, completed_at, certificate_hash")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("full_name, email")
        .eq("id", user.id)
        .single(),
      supabase
        .from("organizations")
        .select("name, legal_name")
        .eq("id", orgId)
        .single(),
    ]);

  if (!completion) {
    return NextResponse.json({ error: "not_completed" }, { status: 404 });
  }

  const row = completion as {
    score: number;
    completed_at: string;
    certificate_hash: string;
  };
  const profile = (userRow ?? { full_name: null, email: "" }) as {
    full_name: string | null;
    email: string;
  };
  const org = (orgRow ?? { name: "", legal_name: null }) as {
    name: string;
    legal_name: string | null;
  };

  const acceptLang = req.headers.get("accept-language") ?? "";
  const locale: LocaleId = acceptLang.toLowerCase().startsWith("de") ? "de" : "en";
  const content = getLessonContent(lesson, locale);

  const completedDate = new Date(row.completed_at).toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const generatedAt = new Date().toLocaleDateString(
    locale === "de" ? "de-DE" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const messages =
    locale === "de"
      ? {
          headerTitle: "Seentrix Academy — Zertifikat",
          eyebrow: "Zertifikat",
          title: "Abschlussbescheinigung",
          subtitle: "Bestätigt durch Seentrix Academy",
          recipientLabel: "Ausgestellt an",
          completedBody:
            "hat die folgende Lektion absolviert und die zugehörige Quizprüfung bestanden:",
          dateLabel: "Abschlussdatum",
          certIdLabel: "Zertifikat-ID",
          disclaimer:
            "Bildungsmaterial, keine Rechtsberatung. Die Zertifikat-ID ist ein SHA-256-Hash und kann gegen den academy_completions-Datensatz des ausstellenden Organisationskontos verifiziert werden.",
        }
      : {
          headerTitle: "Seentrix Academy — Certificate",
          eyebrow: "Certificate",
          title: "Certificate of completion",
          subtitle: "Issued by the Seentrix Academy",
          recipientLabel: "Awarded to",
          completedBody:
            "has completed the following lesson and passed its knowledge check:",
          dateLabel: "Completion date",
          certIdLabel: "Certificate ID",
          disclaimer:
            "Educational material, not legal advice. The certificate ID is a SHA-256 hash that can be verified against the issuing organisation's academy_completions record.",
        };

  const buffer = await renderToBuffer(
    <AcademyCertificatePdf
      data={{
        memberName: profile.full_name ?? profile.email,
        memberEmail: profile.email,
        orgName: org.legal_name || org.name || "",
        lessonTitle: content.title,
        lessonDuration: lesson.duration,
        completedAt: completedDate,
        scorePercent: `${Math.round(row.score * 100)}%`,
        certificateHash: row.certificate_hash,
      }}
      messages={messages}
      generatedAt={generatedAt}
    />,
  );

  const lessonSlug = lessonId.slice(0, 32);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="seentrix-certificate-${lessonSlug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
