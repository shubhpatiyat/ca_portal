import type { LegalDocuments, PageSection, PublicSitePage, TemplateKey, ThemeKey } from "@/types/site";
import { createBrowserSupabaseClient, getSupabaseAccessToken } from "@/lib/auth/supabase";

export type AdminUser = {
  id: string;
  email: string;
  organization: AdminOrganization;
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  city: string;
  role: "owner" | "editor" | "viewer";
  template_key: TemplateKey;
  theme_key: ThemeKey;
  default_subdomain?: string | null;
  default_url?: string | null;
  legal_documents: LegalDocuments;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service_interest?: string;
  message?: string;
  source_page_slug: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export type AnalyticsMetric = {
  value: number;
  previous: number;
  change_percent?: number | null;
};

export type AnalyticsSummary = {
  period_days: 7 | 30 | 90;
  visitors: AnalyticsMetric;
  page_views: AnalyticsMetric;
  new_enquiries: AnalyticsMetric;
  conversion_rate: AnalyticsMetric;
  phone_clicks: AnalyticsMetric;
  whatsapp_clicks: AnalyticsMetric;
  email_clicks: AnalyticsMetric;
  client_logins: AnalyticsMetric;
};

export type FirmClient = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  portal_enabled: boolean;
  status: "active" | "inactive" | "blocked";
  company_count: number;
  document_count: number;
  generated_password?: string | null;
  created_at: string;
};

export type ClientCompany = {
  id: string;
  client_id: string;
  client_name: string;
  company_name: string;
  company_type: "Individual" | "HUF" | "Partnership" | "LLP" | "Company" | "AOP" | "BOI" | "OJP";
  registered_address?: string | null;
  registration_number?: string | null;
  registered_email?: string | null;
  pan?: string | null;
  gst?: string | null;
  other_id_type?: string | null;
  other_id_value?: string | null;
  portal_visible: boolean;
  can_upload: boolean;
  can_download: boolean;
  can_view_billing: boolean;
  can_view_tally: boolean;
  document_count: number;
  created_at: string;
};

export type CompanyDocument = {
  id: string;
  client_id: string;
  client_name: string;
  company_id: string;
  company_name: string;
  financial_year: string;
  month?: string | null;
  document_type: string;
  document_name: string;
  status: "requested" | "uploading" | "uploaded" | "under_review" | "approved" | "rejected" | "shared";
  visible_to_client: boolean;
  allow_client_upload: boolean;
  allow_client_download: boolean;
  storage_provider: string;
  storage_path?: string | null;
  web_url?: string | null;
  size_bytes?: number | null;
  created_at: string;
  updated_at: string;
};

export type FirmClientPayload = {
  name: string;
  mobile: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  portal_enabled: boolean;
};

export type ClientCompanyPayload = {
  client_id: string;
  company_name: string;
  company_type: ClientCompany["company_type"];
  registered_address?: string;
  registration_number?: string;
  registered_email?: string;
  pan?: string;
  gst?: string;
  portal_visible: boolean;
  can_upload: boolean;
  can_download: boolean;
  can_view_billing: boolean;
  can_view_tally: boolean;
};

export type CompanyDocumentPayload = {
  company_id: string;
  financial_year: string;
  month?: string;
  document_type: string;
  document_name: string;
  status: CompanyDocument["status"];
  visible_to_client: boolean;
  allow_client_upload: boolean;
  allow_client_download: boolean;
  storage_provider: "app" | "onedrive" | "manual";
  storage_path?: string;
  web_url?: string;
};

export type CustomDomain = {
  id: string;
  hostname: string;
  domain_type: "platform" | "custom";
  is_primary: boolean;
  is_verified: boolean;
  verification_status: "pending" | "verified" | "failed";
  verification_record_name?: string | null;
  verification_record_value?: string | null;
  dns_target?: string | null;
  dns_record_type?: "A" | "CNAME" | null;
  provisioning_status:
    | "pending_ownership"
    | "provisioning"
    | "pending_provider_verification"
    | "pending_dns"
    | "ready"
    | "configuration_required"
    | "failed";
  is_ready: boolean;
  provider_verification_record_name?: string | null;
  provider_verification_record_value?: string | null;
  provider_error?: string | null;
  provider_checked_at?: string | null;
  verified_at?: string | null;
  last_checked_at?: string | null;
  created_at: string;
};

export type OnboardingPayload = {
  firmName: string;
  founderName: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  services: string[];
  templateKey: TemplateKey;
  themeKey: ThemeKey;
};

const apiBaseUrl = "/backend";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new Error("Sign in before using the admin workspace.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new AdminApiError(message || `Admin request failed with ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return { ok: true } as T;
  }

  return response.json() as Promise<T>;
}

export const adminApi = {
  me: () => request<AdminUser>("/api/v1/admin/me"),
  homePage: () => request<PublicSitePage>("/api/v1/admin/pages/home"),
  updateDraft: (sections: PageSection[]) =>
    request<{ ok: boolean }>("/api/v1/admin/pages/home/draft", {
      method: "PATCH",
      body: JSON.stringify({ sections })
    }),
  publish: () =>
    request<{ published_revision_id: string; published_at: string }>("/api/v1/admin/pages/home/publish", {
      method: "POST"
    }),
  onboard: (payload: OnboardingPayload) =>
    request<{ organization_slug: string; default_subdomain?: string | null; default_url?: string | null; preview_url: string }>("/api/v1/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateOrganization: (payload: {
    name?: string;
    city?: string;
    theme_key?: ThemeKey;
    contact_phone?: string;
    contact_whatsapp?: string;
    contact_email?: string;
    contact_address?: string;
    legal_documents?: LegalDocuments;
  }) =>
    request<AdminOrganization>("/api/v1/admin/organization", {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  clients: () => request<FirmClient[]>("/api/v1/admin/clients"),
  createClient: (payload: FirmClientPayload) =>
    request<FirmClient>("/api/v1/admin/clients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  companies: () => request<ClientCompany[]>("/api/v1/admin/companies"),
  createCompany: (payload: ClientCompanyPayload) =>
    request<ClientCompany>("/api/v1/admin/companies", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  documents: () => request<CompanyDocument[]>("/api/v1/admin/documents"),
  createDocument: (payload: CompanyDocumentPayload) =>
    request<CompanyDocument>("/api/v1/admin/documents", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  domains: () => request<CustomDomain[]>("/api/v1/admin/domains"),
  addDomain: (hostname: string) =>
    request<CustomDomain>("/api/v1/admin/domains", {
      method: "POST",
      body: JSON.stringify({ hostname })
    }),
  verifyDomain: (domainId: string) =>
    request<CustomDomain>(`/api/v1/admin/domains/${domainId}/verify`, {
      method: "POST"
    }),
  makeDomainPrimary: (domainId: string) =>
    request<CustomDomain>(`/api/v1/admin/domains/${domainId}/primary`, {
      method: "POST"
    }),
  deleteDomain: (domainId: string) =>
    request<{ ok: boolean }>(`/api/v1/admin/domains/${domainId}`, {
      method: "DELETE"
    }),
  leads: () => request<Lead[]>("/api/v1/admin/leads"),
  analyticsSummary: (days: 7 | 30 | 90) =>
    request<AnalyticsSummary>(`/api/v1/admin/analytics/summary?days=${days}`),
  updateLead: (leadId: string, status: Lead["status"]) =>
    request<Lead>(`/api/v1/admin/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  signIn: async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      throw new Error("Sign in is not available right now. Please try again later.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    const redirectTo =
      typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback?next=/admin/onboarding`;

    if (apiBaseUrl && redirectTo) {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/signup-link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, redirect_to: redirectTo })
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Signup request failed with ${response.status}`);
      }

      return response.json() as Promise<{ action_link: string }>;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      throw new Error("Account creation is not available right now. Please try again later.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      throw error;
    }
    return { hasSession: Boolean(data.session), emailConfirmed: Boolean(data.user?.email_confirmed_at) };
  },
  signOut: async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
};
