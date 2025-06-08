"use server"

import { createServerClient } from "@/lib/supabase/server" // Refactored import
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Profile } from "@/types/supabase" // Imported Profile and Tender types

export async function getAgencyUsers(agencyId: string) {
  const supabase = createServerClient() // Refactored client initialization

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || !profile || (profile.role !== "agency" && profile.role !== "admin")) {
    return { users: null, error: "Unauthorized" }
  }

  // If agency user, ensure they are requesting users from their own agency
  if (profile.role === "agency" && profile.agency_id !== agencyId) {
    return { users: null, error: "Unauthorized: Not your agency's users" }
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("agency_id", agencyId)
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching agency users:", error)
    return { users: null, error: error.message }
  }

  return { users: users as Profile[], error: null } // Cast to Profile[]
}

export async function updateTenderTeam(tenderId: string, pregoeiroId: string | null, teamMembers: string[]) {
  const supabase = createServerClient() // Refactored client initialization

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || !currentProfile || (currentProfile.role !== "agency" && currentProfile.role !== "admin")) {
    return { success: false, message: "Unauthorized" }
  }

  // Fetch the tender to verify agency_id
  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("agency_id, created_by")
    .eq("id", tenderId)
    .single()

  if (tenderError || !tender) {
    return { success: false, message: "Tender not found." }
  }

  // Ensure the current user is authorized to modify this tender's team
  // Only the agency owner of the tender or an admin can modify
  if (currentProfile.role === "agency" && currentProfile.agency_id !== tender.agency_id) {
    return { success: false, message: "Unauthorized: You can only manage teams for your agency's tenders." }
  }

  // Validate that pregoeiroId and teamMembers belong to the same agency
  const allTeamIds = [...(pregoeiroId ? [pregoeiroId] : []), ...teamMembers]
  if (allTeamIds.length > 0) {
    const { data: selectedProfiles, error: selectedProfilesError } = await supabase
      .from("profiles")
      .select("id, agency_id")
      .in("id", allTeamIds)

    if (selectedProfilesError || !selectedProfiles) {
      return { success: false, message: "Error validating selected users." }
    }

    const invalidUsers = selectedProfiles.filter((p) => p.agency_id !== tender.agency_id)
    if (invalidUsers.length > 0) {
      return { success: false, message: "Selected pregoeiro or team members do not belong to this agency." }
    }
  }

  const { error } = await supabase
    .from("tenders")
    .update({
      pregoeiro_id: pregoeiroId,
      team_members: teamMembers,
    })
    .eq("id", tenderId)

  if (error) {
    console.error("Error updating tender team:", error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/dashboard/tenders/${tenderId}`)
  return { success: true, message: "Equipe da licitação atualizada com sucesso!" }
}
