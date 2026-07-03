import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  browserClient ??= createClient(url, anonKey);
  return browserClient;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const devUserId = process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID;
  if (devUserId) {
    return `dev.${devUserId}`;
  }

  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
