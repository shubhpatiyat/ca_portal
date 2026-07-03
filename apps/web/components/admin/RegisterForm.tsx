"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await adminApi.signUp(email, password);
        if (result.hasSession) {
          router.push("/admin/onboarding");
          router.refresh();
          return;
        }
        setNotice("Account created. Check your email to confirm your account, then sign in.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not create account.");
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
      <label className="grid gap-2 text-sm font-medium">
        Confirm password
        <input className="min-h-11 rounded-md border px-3" name="confirmPassword" type="password" required />
      </label>
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-primary" href="/admin/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
