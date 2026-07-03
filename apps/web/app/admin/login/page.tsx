import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <div className="w-full rounded-lg border bg-card p-6 shadow-soft">
        <h1 className="font-serif text-3xl font-bold text-primary">Sign in</h1>
        <p className="mt-3 text-muted-foreground">Use Supabase Auth email and password to manage your firm website.</p>
        <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading sign in...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
