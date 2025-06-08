import { createClientSupabaseClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase" // Import the Database type

let supabaseInstance: SupabaseClient<Database> | null = null // Apply Database type here

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientSupabaseClient()
  }
  return supabaseInstance
}
