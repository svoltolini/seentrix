import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ForgotPasswordForm locale={locale} />;
}

export const metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};
