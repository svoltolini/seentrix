import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the internal admin console.
 *
 * The console is a cross-tenant Seentrix-staff tool, so it must read past the
 * per-org RLS that protects customer data everywhere else. That power is why
 * every entry point is gated by `requirePlatformStaff()` and every mutation is
 * written to `admin_audit`. This client must NEVER be imported into anything
 * that runs with a customer session — the `server-only` guard above makes a
 * client bundle fail the build if someone tries.
 */
let _client: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service credentials missing — set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
