import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for background jobs.
 * Bypasses RLS — use only inside Trigger.dev tasks where the
 * service role key is securely available.
 */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service-role credentials");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
