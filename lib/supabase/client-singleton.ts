import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
}
