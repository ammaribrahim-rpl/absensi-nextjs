// lib/supabase/server.ts — Supabase client untuk Server Components & Route Handlers
// Menggunakan anon key — untuk operasi publik
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
