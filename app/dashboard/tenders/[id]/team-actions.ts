"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase" // Assuming you have a Supabase database type

export async function updateTenderTeam(tenderId: string, pregoeiroId: string | undefined, teamMembers: string[]) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Perfil do usuário não encontrado." }
  }

  const { data: tender, error: tenderError } = await supabase
    .from("tenders")
    .select("id, created_by, agency_id, pregoeiro_id")
    .eq("id", tenderId)
    .single()

  if (tenderError || !tender) {
    return { success: false, error: "Licitação não encontrada." }
  }

  // Authorization check: Only the tender creator (agency user) or an admin can update the team
  // Also, ensure the user is part of the agency that owns the tender
  if (profile.role !== "admin" && (profile.role !== "agency" || profile.agency_id !== tender.agency_id)) {
    return { success: false, error: "Você não tem permissão para alterar o time desta licitação." }
  }

  // Ensure selected pregoeiro and team members belong to the same agency as the tender
  const { data: agencyUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("agency_id", tender.agency_id)
    .in("id", [...(pregoeiroId ? [pregoeiroId] : []), ...teamMembers])

  if (usersError || !agencyUsers || agencyUsers.length !== (pregoeiroId ? 1 : 0) + teamMembers.length) {
    return { success: false, error: "Um ou mais usuários selecionados não pertencem ao seu órgão." }
  }

  const { error } = await supabase
    .from("tenders")
    .update({
      pregoeiro_id: pregoeiroId || null, // Set to null if undefined
      team_members: teamMembers,
    })
    .eq("id", tenderId)

  if (error) {
    console.error("Error updating tender team:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/tenders/${tenderId}`)
  return { success: true }
}

export async function getAgencyUsers(agencyId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: "Usuário não autenticado.", users: [] }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Perfil do usuário não encontrado.", users: [] }
  }

  // Only allow agency users or admins to fetch users for their agency
  if (profile.role !== "admin" && (profile.role !== "agency" || profile.agency_id !== agencyId)) {
    return { success: false, error: "Você não tem permissão para ver os usuários deste órgão.", users: [] }
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("agency_id", agencyId)
    .neq("id", session.user.id) // Exclude the current user from the list
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching agency users:", error)
    return { success: false, error: error.message, users: [] }
  }

  return { success: true, users: users || [] }
}
