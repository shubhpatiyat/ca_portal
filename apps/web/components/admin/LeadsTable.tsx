"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Lead } from "@/lib/api/admin";

const statuses: Array<Lead["status"] | "all"> = ["all", "new", "contacted", "closed"];

export function LeadsTable() {
  const [filter, setFilter] = useState<Lead["status"] | "all">("all");
  const queryClient = useQueryClient();
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: adminApi.leads });
  const mutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: Lead["status"] }) => adminApi.updateLead(leadId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] })
  });

  const leads = useMemo(() => {
    const values = leadsQuery.data ?? [];
    return filter === "all" ? values : values.filter((lead) => lead.status === filter);
  }, [filter, leadsQuery.data]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${filter === status ? "bg-primary text-primary-foreground" : "bg-card"}`}
            key={status}
            type="button"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        {leads.map((lead) => (
          <div className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[1fr_180px_180px]" key={lead.id}>
            <div>
              <p className="font-semibold text-primary">{lead.name}</p>
              <p className="text-sm text-muted-foreground">{lead.phone} {lead.email ? `- ${lead.email}` : ""}</p>
              <p className="mt-2 text-sm text-muted-foreground">{lead.message ?? lead.service_interest}</p>
            </div>
            <div className="text-sm">
              <span className="rounded-md bg-muted px-2 py-1 font-semibold">{lead.status}</span>
              <p className="mt-2 text-muted-foreground">{new Date(lead.created_at).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <select
                className="min-h-10 w-full rounded-md border px-3 text-sm"
                value={lead.status}
                onChange={(event) => mutation.mutate({ leadId: lead.id, status: event.target.value as Lead["status"] })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
