import { redirect } from "next/navigation";

/**
 * Legacy route — the Glossary lives inside the Academy page as a tab now.
 * Kept as a 308 redirect so old bookmarks and the links embedded in earlier
 * commits still resolve.
 */
export default async function LegacyGlossaryRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/app/academy?tab=glossary`);
}

export const metadata = { title: "Glossary" };
