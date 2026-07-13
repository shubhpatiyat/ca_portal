"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clientPortalApi } from "@/lib/api/client-portal";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    clientPortalApi
      .login({
        email,
        password,
        hostname: window.location.host
      })
      .then((result) => {
        clientPortalApi.saveToken(result.access_token);
        router.push("/client/dashboard");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not sign in."))
      .finally(() => setIsLoading(false));
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/35 p-4">
      <section className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole size={20} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-primary">Client Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use the email and password shared by your CA office.</p>
        </div>

        {error ? <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

        <form className="grid gap-4" onSubmit={login}>
          <label className="grid gap-1 text-sm font-medium text-primary">
            Email
            <input
              className="min-h-11 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-primary">
            Password
            <input
              className="min-h-11 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <Button type="submit" disabled={isLoading}>
            <LogIn size={16} /> {isLoading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </section>
    </main>
  );
}
