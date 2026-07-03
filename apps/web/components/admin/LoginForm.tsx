"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { isLocalDevHost } from "@/lib/auth/supabase";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const hasDevAuth = Boolean(process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID) && isLocalDevHost();

  function continueWithDevAuth() {
    router.push(next);
    router.refresh();
  }

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setError(null);
    startTransition(async () => {
      try {
        await adminApi.signIn(email, password);
        router.push(next);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not sign in.");
      }
    });
  }

  return (
    <form className="mt-6 grid gap-4" action={onSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input className="min-h-11 rounded-md border px-3" name="email" type="email" placeholder="owner@firm.in" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input className="min-h-11 rounded-md border px-3" name="password" type="password" required />
      </label>
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Continue"}
      </Button>
      {hasDevAuth ? (
        <div className="grid gap-2 rounded-md border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            Local dev token is enabled, so API calls can work without browser sign in.
          </p>
          <button className="text-left text-sm font-semibold text-primary" type="button" onClick={continueWithDevAuth}>
            Continue with local dev auth
          </button>
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Need an account?{" "}
        <Link className="font-semibold text-primary" href="/admin/register">
          Register
        </Link>
      </p>
    </form>
  );
}
