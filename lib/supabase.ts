import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Graceful fallback — don't crash if env vars missing during dev
  if (!url || !key) {
    console.warn('[Supabase] Missing env vars — using mock client');
    // Return a mock that returns empty data instead of crashing
    return createClient('https://placeholder.supabase.co', 'placeholder_key');
  }

  _client = createClient(url, key);
  return _client;
}

export const supabase = {
  from: (table: string) => getSupabase().from(table),
  rpc:  (fn: string, args?: Record<string, unknown>) => getSupabase().rpc(fn, args),
};

export interface DBPioneer {
  id: string;
  pi_id: string;
  username: string;
  name: string;
  profession: string;
  bio: string | null;
  tier: string;
  services: string;
  likes: number;
  rating: number;
  rating_count: number;
  heritage: number;
  is_for_sale: boolean;
  sale_price: number | null;
  engraved_at: number;
  created_at: string;
}
