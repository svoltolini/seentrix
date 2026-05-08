import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

export const metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};
