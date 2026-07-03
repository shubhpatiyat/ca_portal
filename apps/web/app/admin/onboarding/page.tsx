import { OnboardingWizard } from "@/components/admin/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-primary">Launch your firm website</h1>
        <p className="mt-2 text-muted-foreground">Answer business-friendly questions and review before publishing.</p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
