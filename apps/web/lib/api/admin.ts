import type { PageSection, PublicSitePage, TemplateKey, ThemeKey } from "@/types/site";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

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
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required for the admin workspace.");
  }

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
  updateOrganization: (payload: { name?: string; city?: string; theme_key?: ThemeKey }) =>
    request<AdminOrganization>("/api/v1/admin/organization", {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  leads: () => request<Lead[]>("/api/v1/admin/leads"),
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
