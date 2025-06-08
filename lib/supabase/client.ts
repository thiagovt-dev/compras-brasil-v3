import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a single supabase client instance for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createClientSupabaseClient() {
  return supabase
}
