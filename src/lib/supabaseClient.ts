import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/**
 * The app's one Supabase client (boats, castle scores), or null when the
 * project isn't configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY unset,
 * e.g. a local preview) -- callers then fall back to this browser's storage.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  client = url && anonKey ? createClient(url, anonKey) : null;
  return client;
}
