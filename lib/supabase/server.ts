import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase" // Import the Database type
import type { Tables } from "@/types/supabase" // Declare the Tables variable

export function createServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>(
    // Apply Database type here
    {
      cookies: () => cookieStore,
    },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )
}

export function createServerClientWithAuth() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>(
    // Apply Database type here
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )
}

// Add these new functions for fetching live sessions
export async function getLiveSessionsForAgency(agencyId: string | null) {
  const supabase = createServerClient() // Refactored client initialization

  if (!agencyId) {
    return { data: [], error: null }
  }

  // Fetch tenders where the agency_id matches and status is 'active' or 'in_progress'
  // You might need to adjust the table name and status values based on your schema
  const { data, error } = await supabase
    .from("tenders") // Assuming 'tenders' is your table for licitações
    .select("*")
    .eq("agency_id", agencyId)
    .in("status", ["active", "in_progress", "live"]) // Adjust statuses as per your application
    .order("opening_date", { ascending: false }) // Changed to opening_date as start_date might not exist

  return { data, error }
}

export async function getLiveSessionsForSupplier(userId: string) {
  const supabase = createServerClient() // Refactored client initialization

  // Fetch tenders where the supplier (user) is a participant and status is 'active' or 'in_progress'
  // This assumes you have a way to link users to tender participations.
  // For example, a 'tender_participants' table or an array column in 'tenders'.
  // For now, let's assume a simple join or a direct check if the user is linked.
  // This might need adjustment based on your actual database schema for tender participation.

  // Example: Fetch tenders where the user has registered participation
  // This is a simplified example. You might need a more complex query
  // if participation is stored in a separate table.
  const { data, error } = await supabase
    .from("tender_participants") // Assuming a table linking users to tenders
    .select("tenders(*)") // Select all columns from the joined tenders table
    .eq("user_id", userId)
    .in("tenders.status", ["active", "in_progress", "live"]) // Adjust statuses as per your application
    .order("tenders.opening_date", { ascending: false }) // Changed to opening_date

  // The data will be an array of objects like { tenders: { ...tender_data } }
  // We need to map it to get just the tender objects.
  const tenders = (data?.map((item) => item.tenders).filter(Boolean) as Tables<"tenders">[]) || [] // Filter out nulls and cast

  return { data: tenders, error }
}
