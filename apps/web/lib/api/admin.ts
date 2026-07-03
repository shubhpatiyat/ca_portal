import type { PageSection, PublicSitePage, TemplateKey, ThemeKey } from "@/types/site";
import { demoPage } from "@/lib/demo-site";
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

async function fetchPublicHomePage(): Promise<PublicSitePage> {
  if (!apiBaseUrl) {
    return demoPage;
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/public/sites/by-slug/sharma-associates/pages/home`, {
    headers: {
      "content-type": "application/json"
    }
  });

  if (!response.ok) {
    return demoPage;
  }

  return response.json() as Promise<PublicSitePage>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    return mockRequest<T>(path, init);
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
    throw new Error(message || `Admin request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return { ok: true } as T;
  }

  return response.json() as Promise<T>;
}

function mockRequest<T>(path: string, init?: RequestInit): T {
  if (path === "/api/v1/admin/me") {
    return {
      id: "00000000-0000-4000-8000-000000000001",
      email: "owner@sharmaassociates.in",
      organization: {
        id: demoPage.organization_id,
        name: demoPage.firm_name,
        slug: demoPage.organization_slug,
        city: demoPage.city,
        role: "owner",
        default_subdomain: "sharma-associates",
        default_url: "http://sharma-associates.lvh.me:3000"
      }
    } as T;
  }

  if (path.includes("/pages/home")) {
    return demoPage as T;
  }

  if (path === "/api/v1/admin/organization" && init?.method === "PATCH") {
    const body = init.body ? JSON.parse(String(init.body)) as Partial<Pick<AdminOrganization, "name" | "city">> : {};
    return {
      id: demoPage.organization_id,
      name: body.name ?? demoPage.firm_name,
      slug: demoPage.organization_slug,
      city: body.city ?? demoPage.city,
      role: "owner",
      default_subdomain: "sharma-associates",
      default_url: "http://sharma-associates.lvh.me:3000"
    } as T;
  }

  if (path === "/api/v1/admin/leads") {
    return [
      {
        id: "lead-1",
        name: "Rohit Mehta",
        phone: "+91 98765 43210",
        email: "rohit@example.com",
        service_interest: "GST Registration & Returns",
        message: "Need help correcting last quarter's returns.",
        source_page_slug: "home",
        status: "new",
        created_at: "2026-06-30T10:00:00+05:30"
      },
      {
        id: "lead-2",
        name: "Priya Nair",
        phone: "+91 91234 56789",
        service_interest: "Accounting & Bookkeeping",
        source_page_slug: "contact",
        status: "contacted",
        created_at: "2026-06-29T15:15:00+05:30"
      }
    ] as T;
  }

  if (init?.method === "POST" || init?.method === "PATCH") {
    return { ok: true } as T;
  }

  return {} as T;
}

export const adminApi = {
  me: () => request<AdminUser>("/api/v1/admin/me"),
  homePage: async () => {
    try {
      return await request<PublicSitePage>("/api/v1/admin/pages/home");
    } catch {
      return fetchPublicHomePage();
    }
  },
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
  updateOrganization: (payload: { name?: string; city?: string }) =>
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
      throw new Error("Supabase URL and anon key are required for browser sign in.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase URL and anon key are required for browser registration.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback?next=/admin/onboarding`
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
