import { LeadsTable } from "@/components/admin/LeadsTable";

export default function LeadsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Leads</h1>
        <p className="mt-2 text-muted-foreground">Consultation requests from the public website.</p>
      </div>
      <LeadsTable />
    </div>
  );
}
