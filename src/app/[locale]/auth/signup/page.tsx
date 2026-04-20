import { SignupForm } from "./signup-form";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <SignupForm locale={locale} />;
}

export const metadata = { title: "Sign up" };
