import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LoginForm locale={locale} />;
}

export const metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};
