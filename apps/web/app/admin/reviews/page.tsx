export default function ReviewsPage() {
  return <SimpleAdminPage title="Client Reviews" body="Add, hide or edit testimonials before showing them on the public website." />;
}

function SimpleAdminPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h1 className="font-serif text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
    </div>
  );
}
