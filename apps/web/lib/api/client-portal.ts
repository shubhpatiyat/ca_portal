const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const tokenKey = "ca-client-portal-token";

export type ClientPortalUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  portal_enabled: boolean;
  must_reset_password: boolean;
  firm_name: string;
  firm_slug: string;
};

export type ClientPortalCompany = {
  id: string;
  company_name: string;
  company_type: string;
  pan?: string | null;
  gst?: string | null;
  can_upload: boolean;
  can_download: boolean;
  can_view_billing: boolean;
  can_view_tally: boolean;
  document_count: number;
};

export type ClientPortalDocument = {
  id: string;
  company_id: string;
  company_name: string;
  financial_year: string;
  month?: string | null;
  document_type: string;
  document_name: string;
  status: string;
  allow_client_upload: boolean;
  allow_client_download: boolean;
  web_url?: string | null;
  updated_at: string;
};

export type ClientPortalDashboard = {
  client: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    must_reset_password: boolean;
  };
  companies: ClientPortalCompany[];
  documents: ClientPortalDocument[];
};

export type ClientDocumentUploadPayload = {
  file_name: string;
  file_size: number;
  mime_type?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("Client portal API is not configured.");
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Client portal request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const clientPortalApi = {
  token: () => (typeof window === "undefined" ? null : window.localStorage.getItem(tokenKey)),
  saveToken: (token: string) => window.localStorage.setItem(tokenKey, token),
  clearToken: () => window.localStorage.removeItem(tokenKey),
  login: (payload: { email: string; password: string; hostname: string }) =>
    request<{ access_token: string; client: ClientPortalUser }>("/api/v1/client/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  dashboard: () => {
    const token = clientPortalApi.token();
    if (!token) {
      throw new Error("Client login is required.");
    }
    return request<ClientPortalDashboard>("/api/v1/client/dashboard", {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
  },
  uploadDocument: (documentId: string, payload: ClientDocumentUploadPayload) => {
    const token = clientPortalApi.token();
    if (!token) {
      throw new Error("Client login is required.");
    }
    return request<{ document: ClientPortalDocument }>(`/api/v1/client/documents/${documentId}/upload`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  }
};
