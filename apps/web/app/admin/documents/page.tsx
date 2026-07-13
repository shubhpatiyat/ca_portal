"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type CompanyDocument } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const companyId = searchParams.get("companyId");
  const documentsQuery = useQuery({ queryKey: ["admin-documents"], queryFn: adminApi.documents, retry: false });
  const documents = documentsQuery.data ?? [];
  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      if (clientId && document.client_id !== clientId) {
        return false;
      }
      if (companyId && document.company_id !== companyId) {
        return false;
      }
      return true;
    });
  }, [clientId, companyId, documents]);
  const headingContext = filteredDocuments[0]
    ? [filteredDocuments[0].client_name, companyId ? filteredDocuments[0].company_name : null].filter(Boolean).join(" · ")
    : "All clients";

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/admin/clients">
            <ArrowLeft size={16} /> Clients
          </Link>
          <h1 className="font-serif text-3xl font-bold text-primary">Documents</h1>
          <p className="mt-2 text-muted-foreground">{headingContext}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <FileText size={18} className="text-primary" />
          <h2 className="font-semibold text-primary">Document List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">FY</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Client Visible</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentsQuery.isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={9}>Loading documents...</td>
                </tr>
              ) : null}
              {!documentsQuery.isLoading && !filteredDocuments.length ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={9}>No documents found for this view.</td>
                </tr>
              ) : null}
              {filteredDocuments.map((document) => (
                <DocumentRow document={document} key={document.id} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DocumentRow({ document }: { document: CompanyDocument }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="px-4 py-4">
        <div className="font-semibold text-primary">{document.document_name}</div>
        <div className="text-xs text-muted-foreground">{document.storage_provider}</div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{document.client_name}</td>
      <td className="px-4 py-4 text-muted-foreground">{document.company_name}</td>
      <td className="px-4 py-4 text-muted-foreground">{document.financial_year}</td>
      <td className="px-4 py-4 text-muted-foreground">{document.month ?? "-"}</td>
      <td className="px-4 py-4 text-muted-foreground">{document.document_type}</td>
      <td className="px-4 py-4">
        <span className={cn("rounded-md px-2 py-1 text-xs font-semibold capitalize", statusClass(document.status))}>
          {document.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{document.visible_to_client ? "Yes" : "No"}</td>
      <td className="px-4 py-4">
        {document.web_url ? (
          <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold" href={document.web_url} target="_blank">
            <ExternalLink size={14} /> Open
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">No file link</span>
        )}
      </td>
    </tr>
  );
}

function statusClass(status: CompanyDocument["status"]) {
  if (status === "approved" || status === "shared" || status === "uploaded") {
    return "bg-accent/15 text-accent";
  }
  if (status === "rejected") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading documents...</div>}>
      <DocumentsPageContent />
    </Suspense>
  );
}
