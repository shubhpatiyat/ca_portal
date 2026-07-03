export default function HistoryPage() {
  const events = ["Home page published", "Contact form updated", "Logo uploaded", "Draft restored"];
  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-3xl font-bold text-primary">Website History</h1>
      <div className="rounded-lg border bg-card">
        {events.map((event, index) => (
          <div className="border-b p-4 last:border-b-0" key={event}>
            <p className="font-semibold text-primary">{event}</p>
            <p className="text-sm text-muted-foreground">{index + 1} day{index === 0 ? "" : "s"} ago</p>
          </div>
        ))}
      </div>
    </div>
  );
}
