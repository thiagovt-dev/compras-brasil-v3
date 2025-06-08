import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase" // Import the Database type

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a single supabase client instance for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) // Apply Database type here

export function createClientSupabaseClient() {
  return supabase
}
