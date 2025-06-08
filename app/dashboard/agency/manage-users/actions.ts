"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getAgencyUsers(agencyId: string) {
  const supabase = createServerClient()

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

  return { users: users as any[], error: null } // Cast to any[]
}

export async function createUser(formData: FormData) {
  const supabase = createServerClient()

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

  if (profileError || !currentProfile || currentProfile.role !== "agency") {
    return { success: false, message: "Unauthorized" }
  }

  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string // Should be 'agency' or 'admin' for agency users

  if (!fullName || !email || !password || !role) {
    return { success: false, message: "Missing required fields." }
  }

  // Create user in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Automatically confirm email
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { success: false, message: authError.message }
  }

  if (!authUser.user) {
    return { success: false, message: "Failed to create auth user." }
  }

  // Create profile entry
  const { error: profileInsertError } = await supabase.from("profiles").insert({
    id: authUser.user.id,
    full_name: fullName,
    email: email, // Store email in profile for easier access
    role: role,
    agency_id: currentProfile.agency_id, // Link to the current agency's ID
  })

  if (profileInsertError) {
    console.error("Error creating profile:", profileInsertError)
    // Optionally, delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return { success: false, message: profileInsertError.message }
  }

  revalidatePath("/dashboard/agency/manage-users")
  return { success: true, message: "User created successfully." }
}

export async function updateUser(formData: FormData) {
  const supabase = createServerClient()

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

  if (profileError || !currentProfile || currentProfile.role !== "agency") {
    return { success: false, message: "Unauthorized" }
  }

  const userId = formData.get("id") as string
  const fullName = formData.get("fullName") as string
  const role = formData.get("role") as string

  if (!userId || !fullName || !role) {
    return { success: false, message: "Missing required fields." }
  }

  // Ensure the user being updated belongs to the same agency
  const { data: userToUpdate, error: userToUpdateError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single()

  if (userToUpdateError || !userToUpdate || userToUpdate.agency_id !== currentProfile.agency_id) {
    return { success: false, message: "Unauthorized: Cannot update user from another agency." }
  }

  const { error } = await supabase.from("profiles").update({ full_name: fullName, role: role }).eq("id", userId)

  if (error) {
    console.error("Error updating user:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/agency/manage-users")
  return { success: true, message: "User updated successfully." }
}

export async function deleteUser(userId: string) {
  const supabase = createServerClient()

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

  if (profileError || !currentProfile || currentProfile.role !== "agency") {
    return { success: false, message: "Unauthorized" }
  }

  // Ensure the user being deleted belongs to the same agency and is not the current user
  const { data: userToDelete, error: userToDeleteError } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single()

  if (userToDeleteError || !userToDelete || userToDelete.agency_id !== currentProfile.agency_id) {
    return { success: false, message: "Unauthorized: Cannot delete user from another agency." }
  }

  if (userId === session.user.id) {
    return { success: false, message: "Cannot delete your own account." }
  }

  // Delete from profiles table first (due to foreign key constraints)
  const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", userId)

  if (profileDeleteError) {
    console.error("Error deleting profile:", profileDeleteError)
    return { success: false, message: profileDeleteError.message }
  }

  // Then delete from auth.users
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

  if (authDeleteError) {
    console.error("Error deleting auth user:", authDeleteError)
    return { success: false, message: authDeleteError.message }
  }

  revalidatePath("/dashboard/agency/manage-users")
  return { success: true, message: "User deleted successfully." }
}
