import { SectionEditor } from "@/components/admin/SectionEditor";

export default async function SectionEditorPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params;
  return <SectionEditor sectionId={sectionId} />;
}
