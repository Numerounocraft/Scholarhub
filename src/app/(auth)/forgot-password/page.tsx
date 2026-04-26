import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:no-underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
