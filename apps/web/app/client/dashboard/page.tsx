"use client";

import Link from "next/link";
import type React from "react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  LogOut,
  RefreshCw,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clientPortalApi, type ClientPortalDashboard, type ClientPortalDocument } from "@/lib/api/client-portal";
import { cn } from "@/lib/utils";

const pendingStatuses = new Set(["requested", "uploading", "rejected"]);

export default function ClientDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ClientPortalDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDocument, setUploadDocument] = useState<ClientPortalDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [locallyUploadedIds, setLocallyUploadedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    clientPortalApi
      .dashboard()
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Client login is required."))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleDocuments = data?.documents ?? [];
  const pendingDocuments = useMemo(
    () => visibleDocuments.filter((document) => pendingStatuses.has(document.status) && !locallyUploadedIds.has(document.id)),
    [locallyUploadedIds, visibleDocuments]
  );
  const sharedDocuments = visibleDocuments.filter((document) => !pendingStatuses.has(document.status) || locallyUploadedIds.has(document.id));

  function signOut() {
    clientPortalApi.clearToken();
    router.push("/client/login");
  }

  function chooseFile(file: File | null) {
    if (file) {
      setSelectedFile(file);
    }
  }

  function closeUpload() {
    setUploadDocument(null);
    setSelectedFile(null);
  }

  function confirmUpload() {
    if (!uploadDocument || !selectedFile) {
      return;
    }
    setLocallyUploadedIds((current) => new Set(current).add(uploadDocument.id));
    closeUpload();
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/35 p-4">
        <section className="w-full max-w-md rounded-lg border bg-background p-6">
          <h1 className="font-serif text-2xl font-bold text-primary">Login required</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5" type="button" onClick={() => router.push("/client/login")}>Go to login</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{isLoading ? "Loading..." : data?.client.email}</p>
            <h1 className="truncate font-serif text-2xl font-bold text-primary">{data?.client.name ?? "Client Portal"}</h1>
          </div>
          <button className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold" type="button" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
        <section className="rounded-lg border bg-primary p-5 text-primary-foreground md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <p className="text-sm text-primary-foreground/75">Client workspace</p>
              <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
                {pendingDocuments.length ? `${pendingDocuments.length} upload${pendingDocuments.length === 1 ? "" : "s"} pending` : "Everything is up to date"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/80">
                Upload requested files here. Company, financial year, month and document type are already selected by your CA office.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HeroMetric label="Companies" value={data?.companies.length ?? 0} />
              <HeroMetric label="Pending" value={pendingDocuments.length} />
              <HeroMetric label="Received" value={sharedDocuments.length} />
            </div>
          </div>
        </section>

        {data?.client.must_reset_password ? (
          <p className="rounded-md border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">
            You are using a temporary password. Password change will be available here soon.
          </p>
        ) : null}

        <section className="grid gap-4">
          <SectionTitle icon={<Upload size={18} />} title="Pending Uploads" helper="Pick a card and upload the file. No extra details needed." />
          {isLoading ? <SkeletonGrid /> : null}
          {!isLoading && !pendingDocuments.length ? (
            <Empty
              icon={<CheckCircle2 size={24} />}
              title="No pending uploads"
              text="Your CA office has received everything visible for now."
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingDocuments.map((document) => (
              <UploadTaskCard document={document} key={document.id} onUpload={() => setUploadDocument(document)} />
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <SectionTitle icon={<FolderOpen size={18} />} title="Shared Documents" helper="Files and completed requests from your CA office." />
          {!isLoading && !sharedDocuments.length ? (
            <Empty icon={<FileText size={24} />} title="No shared documents yet" text="Approved files and completed uploads will appear here." />
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {sharedDocuments.map((document) => (
              <SharedDocumentCard document={document} key={document.id} isLocalSuccess={locallyUploadedIds.has(document.id)} />
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <SectionTitle icon={<Building2 size={18} />} title="My Companies" helper="Documents are grouped by these companies in your CA office." />
          {!isLoading && !data?.companies.length ? (
            <Empty icon={<Building2 size={24} />} title="No companies visible" text="Your CA office has not shared company access yet." />
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {data?.companies.map((company) => (
              <article className="rounded-lg border bg-background p-4" key={company.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-primary">{company.company_name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{company.company_type}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{company.document_count} docs</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{company.pan ? `PAN ${company.pan}` : "PAN not added"}{company.gst ? ` · GST ${company.gst}` : ""}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md border px-2 py-1">{company.can_upload ? "Upload allowed" : "Upload off"}</span>
                  <span className="rounded-md border px-2 py-1">{company.can_download ? "Download allowed" : "Download off"}</span>
                  {company.can_view_tally ? <span className="rounded-md border px-2 py-1">Tally enabled</span> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {uploadDocument ? (
        <UploadModal
          document={uploadDocument}
          selectedFile={selectedFile}
          onChooseFile={chooseFile}
          onClose={closeUpload}
          onConfirm={confirmUpload}
        />
      ) : null}
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-primary-foreground/10 p-3">
      <p className="text-xs text-primary-foreground/70">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function SectionTitle({ helper, icon, title }: { helper: string; icon: React.ReactNode; title: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">{icon}{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function UploadTaskCard({ document, onUpload }: { document: ClientPortalDocument; onUpload: () => void }) {
  const rejected = document.status === "rejected";
  return (
    <article className={cn("grid gap-4 rounded-lg border bg-background p-4 shadow-sm", rejected && "border-destructive/40 bg-destructive/5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-semibold", rejected ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary")}>
            {rejected ? "Needs re-upload" : "Upload needed"}
          </span>
          <h3 className="mt-3 font-semibold text-primary">{document.document_name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{document.document_type}</p>
        </div>
        {rejected ? <RefreshCw className="shrink-0 text-destructive" size={20} /> : <Clock3 className="shrink-0 text-secondary" size={20} />}
      </div>
      <div className="grid gap-2 rounded-md bg-muted/45 p-3 text-sm text-muted-foreground">
        <span>{document.company_name}</span>
        <span>FY {document.financial_year}{document.month ? ` · ${document.month}` : ""}</span>
      </div>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground" type="button" onClick={onUpload}>
        <Upload size={16} /> Upload File
      </button>
    </article>
  );
}

function SharedDocumentCard({ document, isLocalSuccess }: { document: ClientPortalDocument; isLocalSuccess: boolean }) {
  return (
    <article className="flex items-start gap-3 rounded-lg border bg-background p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
        {isLocalSuccess ? <CheckCircle2 size={20} /> : <FileCheck2 size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-primary">{document.document_name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{document.company_name} · FY {document.financial_year}{document.month ? ` · ${document.month}` : ""}</p>
          </div>
          <span className={cn("w-fit rounded-md px-2 py-1 text-xs font-semibold capitalize", statusClass(isLocalSuccess ? "uploaded" : document.status))}>
            {isLocalSuccess ? "received" : document.status.replace("_", " ")}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {document.web_url ? (
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold" href={document.web_url} target="_blank">
              <Download size={14} /> Open
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function UploadModal({
  document,
  onChooseFile,
  onClose,
  onConfirm,
  selectedFile
}: {
  document: ClientPortalDocument;
  onChooseFile: (file: File | null) => void;
  onClose: () => void;
  onConfirm: () => void;
  selectedFile: File | null;
}) {
  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onChooseFile(event.dataTransfer.files[0] ?? null);
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    onChooseFile(event.target.files?.[0] ?? null);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <section className="w-full max-w-xl rounded-lg border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-primary">Upload Document</h2>
            <p className="mt-1 text-sm text-muted-foreground">{document.company_name} · FY {document.financial_year}{document.month ? ` · ${document.month}` : ""}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md border" type="button" onClick={onClose} aria-label="Close upload">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="rounded-md bg-muted/45 p-3">
            <p className="font-semibold text-primary">{document.document_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{document.document_type}</p>
          </div>

          <label
            className="grid cursor-pointer place-items-center rounded-lg border border-dashed bg-muted/25 p-8 text-center transition hover:bg-muted/45"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <Upload className="text-secondary" size={28} />
            <span className="mt-3 font-semibold text-primary">{selectedFile ? selectedFile.name : "Drop file here or choose file"}</span>
            <span className="mt-1 text-sm text-muted-foreground">PDF, JPG or PNG</span>
            <input className="sr-only" type="file" accept=".pdf,image/jpeg,image/png" onChange={onInput} />
          </label>

          {selectedFile ? (
            <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              Ready to upload: <strong className="text-primary">{selectedFile.name}</strong>
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" disabled={!selectedFile} onClick={onConfirm}>
              <CheckCircle2 size={16} /> Mark Uploaded
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Empty({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <div className="grid place-items-center rounded-lg border bg-background p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</div>
      <h3 className="mt-3 font-semibold text-primary">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div className="h-52 animate-pulse rounded-lg border bg-muted/40" key={item} />
      ))}
    </div>
  );
}

function statusClass(status: string) {
  if (status === "approved" || status === "shared" || status === "uploaded") {
    return "bg-accent/15 text-accent";
  }
  if (status === "rejected") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}
