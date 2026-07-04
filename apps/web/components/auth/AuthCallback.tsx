"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/auth/supabase";

function safeNextPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/admin/onboarding";
  }
  return value;
}

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();
    const next = safeNextPath(searchParams.get("next"));

    async function finishSignIn() {
      if (!supabase) {
        setError("Sign in is not available right now. Please try again later.");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (mounted) {
            setError(exchangeError.message);
          }
          return;
        }
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) {
            if (mounted) {
              setError(sessionError.message);
            }
            return;
          }
        }
      }

      if (mounted) {
        router.replace(next);
        router.refresh();
      }
    }

    finishSignIn();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="admin-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-primary">Finishing sign in</h1>
        {error ? (
          <>
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            <Link className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/admin/login">
              Go to sign in
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Taking you to your admin workspace...</p>
        )}
      </div>
    </div>
  );
}
