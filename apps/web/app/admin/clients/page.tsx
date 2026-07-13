"use client";

import type React from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight, FilePlus2, FileText, Plus, UserRound } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { adminApi, type ClientCompany, type CompanyDocument, type FirmClient } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const companyTypes: ClientCompany["company_type"][] = ["Individual", "HUF", "Partnership", "LLP", "Company", "AOP", "BOI", "OJP"];
const documentStatuses: CompanyDocument["status"][] = ["requested", "uploaded", "under_review", "approved", "rejected", "shared"];

type ModalState =
  | { type: "client" }
  | { type: "company"; clientId: string }
  | { type: "document"; clientId: string; companyId?: string }
  | null;

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const clientsQuery = useQuery({ queryKey: ["admin-clients"], queryFn: adminApi.clients, retry: false });
  const companiesQuery = useQuery({ queryKey: ["admin-companies"], queryFn: adminApi.companies, retry: false });
  const documentsQuery = useQuery({ queryKey: ["admin-documents"], queryFn: adminApi.documents, retry: false });
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clients = clientsQuery.data ?? [];
  const companies = companiesQuery.data ?? [];
  const documents = documentsQuery.data ?? [];

  const companiesByClient = useMemo(() => {
    return companies.reduce<Record<string, ClientCompany[]>>((grouped, company) => {
      grouped[company.client_id] = [...(grouped[company.client_id] ?? []), company];
      return grouped;
    }, {});
  }, [companies]);

  const pendingDocsByClient = useMemo(() => {
    return documents.reduce<Record<string, number>>((grouped, document) => {
      if (["requested", "uploading", "rejected"].includes(document.status)) {
        grouped[document.client_id] = (grouped[document.client_id] ?? 0) + 1;
      }
      return grouped;
    }, {});
  }, [documents]);

  const metrics = [
    ["Clients", clients.length],
    ["Companies", companies.length],
    ["Pending docs", documents.filter((document) => ["requested", "uploading", "rejected"].includes(document.status)).length],
    ["Portal enabled", clients.filter((client) => client.portal_enabled).length]
  ];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
  }

  function runAction(action: () => Promise<unknown>, message: string) {
    setError(null);
    setNotice(null);
    setIsSaving(true);
    action()
      .then((result) => {
        refresh();
        setModal(null);
        const generatedPassword = typeof result === "object" && result && "generated_password" in result ? String(result.generated_password ?? "") : "";
        setNotice(generatedPassword ? `${message} Development password: ${generatedPassword}` : message);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not save this record."))
      .finally(() => setIsSaving(false));
  }

  function createClient(formData: FormData) {
    runAction(
      () =>
        adminApi.createClient({
          name: String(formData.get("name") ?? "").trim(),
          mobile: String(formData.get("mobile") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          address: optionalText(formData, "address"),
          city: optionalText(formData, "city"),
          state: optionalText(formData, "state"),
          portal_enabled: formData.get("portal_enabled") === "on"
        }),
      "Client created."
    );
  }

  function createCompany(formData: FormData, clientId: string) {
    runAction(
      () =>
        adminApi.createCompany({
          client_id: clientId,
          company_name: String(formData.get("company_name") ?? "").trim(),
          company_type: String(formData.get("company_type") ?? "Individual") as ClientCompany["company_type"],
          registered_address: optionalText(formData, "registered_address"),
          registration_number: optionalText(formData, "registration_number"),
          registered_email: optionalText(formData, "registered_email"),
          pan: optionalText(formData, "pan"),
          gst: optionalText(formData, "gst"),
          portal_visible: formData.get("portal_visible") === "on",
          can_upload: formData.get("can_upload") === "on",
          can_download: formData.get("can_download") === "on",
          can_view_billing: formData.get("can_view_billing") === "on",
          can_view_tally: formData.get("can_view_tally") === "on"
        }),
      "Company added."
    );
  }

  function createDocument(formData: FormData, fallbackCompanyId?: string) {
    runAction(
      () =>
        adminApi.createDocument({
          company_id: String(formData.get("company_id") || fallbackCompanyId || ""),
          financial_year: String(formData.get("financial_year") ?? "").trim(),
          month: optionalText(formData, "month"),
          document_type: String(formData.get("document_type") ?? "").trim(),
          document_name: String(formData.get("document_name") ?? "").trim(),
          status: String(formData.get("status") ?? "requested") as CompanyDocument["status"],
          visible_to_client: formData.get("visible_to_client") === "on",
          allow_client_upload: formData.get("allow_client_upload") === "on",
          allow_client_download: formData.get("allow_client_download") === "on",
          storage_provider: "onedrive",
          storage_path: optionalText(formData, "storage_path"),
          web_url: optionalText(formData, "web_url")
        }),
      "Document requested."
    );
  }

  function rowAction(event: React.MouseEvent, nextModal: ModalState) {
    event.stopPropagation();
    setError(null);
    setNotice(null);
    setModal(nextModal);
  }

  const modalClient = modal?.type === "company" || modal?.type === "document" ? clients.find((client) => client.id === modal.clientId) : null;
  const modalCompanies = modal?.type === "document" ? companiesByClient[modal.clientId] ?? [] : [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Clients</h1>
          <p className="mt-2 text-muted-foreground">Select a client, open companies, and manage requests from actions.</p>
        </div>
        <Button type="button" onClick={() => setModal({ type: "client" })}>
          <Plus size={16} /> Add Client
        </Button>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div className="rounded-lg border bg-card p-5" key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-2xl text-primary">{value}</strong>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-primary">Client List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3">Companies</th>
                <th className="px-4 py-3">Pending Docs</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientsQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={9}>Loading clients...</td>
                </tr>
              ) : null}
              {!clientsQuery.isLoading && !clients.length ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={9}>No clients created yet.</td>
                </tr>
              ) : null}
              {clients.map((client) => {
                const isExpanded = expandedClientId === client.id;
                const clientCompanies = companiesByClient[client.id] ?? [];
                return (
                  <ClientRows
                    client={client}
                    companies={clientCompanies}
                    isExpanded={isExpanded}
                    key={client.id}
                    pendingDocs={pendingDocsByClient[client.id] ?? 0}
                    onToggle={() => setExpandedClientId(isExpanded ? null : client.id)}
                    onAddCompany={(event) => rowAction(event, { type: "company", clientId: client.id })}
                    onRequestDocument={(event, companyId) => rowAction(event, { type: "document", clientId: client.id, companyId })}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modal?.type === "client" ? (
        <Modal title="Add Client" onClose={() => setModal(null)}>
          <form action={createClient} className="grid gap-4">
            <Input name="name" label="Name" required />
            <Input name="mobile" label="Mobile" required />
            <Input name="email" label="Email" type="email" required />
            <Input name="address" label="Address" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="city" label="City" />
              <Input name="state" label="State" />
            </div>
            <Check name="portal_enabled" label="Enable client portal" />
            <ModalActions disabled={isSaving} onCancel={() => setModal(null)} />
          </form>
        </Modal>
      ) : null}

      {modal?.type === "company" && modalClient ? (
        <Modal title={`Add Company · ${modalClient.name}`} onClose={() => setModal(null)}>
          <form action={(formData) => createCompany(formData, modal.clientId)} className="grid gap-4">
            <Input name="company_name" label="Company name" required />
            <Select name="company_type" label="Company type">
              {companyTypes.map((type) => <option value={type} key={type}>{type}</option>)}
            </Select>
            <Input name="registered_address" label="Registered address" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="pan" label="PAN" />
              <Input name="gst" label="GST" />
            </div>
            <Input name="registration_number" label="Registration number" />
            <Input name="registered_email" label="Registered email" type="email" />
            <div className="grid gap-2">
              <Check name="portal_visible" label="Visible in client portal" defaultChecked />
              <Check name="can_upload" label="Client can upload" defaultChecked />
              <Check name="can_download" label="Client can download" defaultChecked />
              <Check name="can_view_billing" label="Show billing" />
              <Check name="can_view_tally" label="Show Tally button" />
            </div>
            <ModalActions disabled={isSaving} onCancel={() => setModal(null)} />
          </form>
        </Modal>
      ) : null}

      {modal?.type === "document" && modalClient ? (
        <Modal title={`Request Document · ${modalClient.name}`} onClose={() => setModal(null)}>
          <form action={(formData) => createDocument(formData, modal.companyId)} className="grid gap-4">
            <Select name="company_id" label="Company" defaultValue={modal.companyId} disabled={Boolean(modal.companyId)}>
              {modalCompanies.map((company) => <option value={company.id} key={company.id}>{company.company_name}</option>)}
            </Select>
            {!modalCompanies.length ? <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Add a company before requesting documents.</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="financial_year" label="Financial year" placeholder="2025-26" required />
              <Input name="month" label="Month" placeholder="July" />
            </div>
            <Input name="document_type" label="Document type" placeholder="GST Return" required />
            <Input name="document_name" label="Document name" placeholder="GSTR-3B July" required />
            <Select name="status" label="Status">
              {documentStatuses.map((status) => <option value={status} key={status}>{status.replace("_", " ")}</option>)}
            </Select>
            <Check name="visible_to_client" label="Visible to client" defaultChecked />
            <Check name="allow_client_upload" label="Client can upload" defaultChecked />
            <Check name="allow_client_download" label="Client can download" />
            <ModalActions disabled={isSaving || !modalCompanies.length} onCancel={() => setModal(null)} />
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function ClientRows({
  client,
  companies,
  isExpanded,
  onAddCompany,
  onRequestDocument,
  onToggle,
  pendingDocs
}: {
  client: FirmClient;
  companies: ClientCompany[];
  isExpanded: boolean;
  onAddCompany: (event: React.MouseEvent) => void;
  onRequestDocument: (event: React.MouseEvent, companyId?: string) => void;
  onToggle: () => void;
  pendingDocs: number;
}) {
  return (
    <>
      <tr className="cursor-pointer border-b transition hover:bg-muted/35" onClick={onToggle}>
        <td className="px-4 py-4 text-muted-foreground">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
        <td className="px-4 py-4">
          <div className="font-semibold text-primary">{client.name}</div>
          <div className="text-xs capitalize text-muted-foreground">{client.status}</div>
        </td>
        <td className="px-4 py-4 text-muted-foreground">{client.mobile}</td>
        <td className="px-4 py-4 text-muted-foreground">{client.email ?? "Not added"}</td>
        <td className="px-4 py-4 text-muted-foreground">{[client.city, client.state].filter(Boolean).join(", ") || "Not added"}</td>
        <td className="px-4 py-4">
          <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", client.portal_enabled ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground")}>
            {client.portal_enabled ? "On" : "Off"}
          </span>
        </td>
        <td className="px-4 py-4 text-muted-foreground">{companies.length}</td>
        <td className="px-4 py-4 text-muted-foreground">{pendingDocs}</td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold" type="button" onClick={onAddCompany}>
              <Building2 size={14} /> Add Company
            </button>
            <button className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold" type="button" onClick={(event) => onRequestDocument(event)}>
              <FilePlus2 size={14} /> Request Doc
            </button>
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold" href={`/admin/documents?clientId=${client.id}`}>
              <FileText size={14} /> View Docs
            </Link>
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="border-b bg-background">
          <td colSpan={9} className="px-4 py-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.4fr] gap-3 border-b bg-muted/35 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                <span>Company</span>
                <span>Type</span>
                <span>PAN</span>
                <span>GST</span>
                <span>Portal</span>
                <span>Actions</span>
              </div>
              {!companies.length ? (
                <div className="px-4 py-5 text-sm text-muted-foreground">No companies added for this client.</div>
              ) : null}
              {companies.map((company) => (
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1.4fr] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={company.id}>
                  <span className="font-medium text-primary">{company.company_name}</span>
                  <span className="text-muted-foreground">{company.company_type}</span>
                  <span className="text-muted-foreground">{company.pan ?? "Not added"}</span>
                  <span className="text-muted-foreground">{company.gst ?? "Not added"}</span>
                  <span>
                    <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", company.portal_visible ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground")}>
                      {company.portal_visible ? "Visible" : "Hidden"}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <button className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold" type="button" onClick={(event) => onRequestDocument(event, company.id)}>
                      <FilePlus2 size={13} /> Request
                    </button>
                    <Link className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold" href={`/admin/documents?clientId=${client.id}&companyId=${company.id}`}>
                      <FileText size={13} /> Docs
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          <button className="rounded-md border px-3 py-1 text-sm font-semibold" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ disabled, onCancel }: { disabled?: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={disabled}>
        <Plus size={16} /> Save
      </Button>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-primary">
      {label}
      <input className="min-h-10 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30" {...props} />
    </label>
  );
}

function Select({ children, label, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-primary">
      {label}
      <select className="min-h-10 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30" {...props}>
        {children}
      </select>
    </label>
  );
}

function Check({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <input className="h-4 w-4 rounded border" type="checkbox" {...props} />
      {label}
    </label>
  );
}
