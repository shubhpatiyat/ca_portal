import { RegisterForm } from "@/components/admin/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center">
      <div className="w-full rounded-lg border bg-card p-6 shadow-soft">
        <h1 className="font-serif text-3xl font-bold text-primary">Create account</h1>
        <p className="mt-3 text-muted-foreground">
          Create your account, then complete onboarding to launch your firm website.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
