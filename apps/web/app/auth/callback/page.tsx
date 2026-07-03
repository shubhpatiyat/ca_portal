import { Suspense } from "react";
import { AuthCallback } from "@/components/auth/AuthCallback";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallback />
    </Suspense>
  );
}

function AuthCallbackFallback() {
  return (
    <div className="admin-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-primary">Finishing sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Taking you to your admin workspace...</p>
      </div>
    </div>
  );
}
