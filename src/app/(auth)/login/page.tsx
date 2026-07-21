import { Suspense } from "react";
import { LoginForm } from "@/components/shared/login-form";

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-2.5 w-2.5 rounded-full bg-accent" />
        <h1 className="text-lg font-semibold text-foreground">Obsidian Performance Coach</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your account</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
