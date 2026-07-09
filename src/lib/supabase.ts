import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — only instantiated when Supabase env vars are present.
// Routes guard with !!process.env.NEXT_PUBLIC_SUPABASE_URL before calling these.

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars not configured");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getAdminClient(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase admin env vars not configured");
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Browser client (uses anon key, respects RLS)
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Server client (service role key — bypasses RLS, use ONLY in API routes)
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
