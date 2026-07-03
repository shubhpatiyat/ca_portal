import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { demoPage } from "@/lib/demo-site";

export default function PreviewPage() {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-soft" data-theme={demoPage.theme_key}>
      <div className="border-b bg-card px-4 py-3 text-sm font-semibold text-secondary">Private draft preview</div>
      <PublicHeader page={demoPage} />
      <SectionRenderer page={demoPage} />
      <PublicFooter page={demoPage} />
    </div>
  );
}
