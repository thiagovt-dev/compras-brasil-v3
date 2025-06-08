"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function manageAgencyUser(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const actionType = formData.get("actionType") as string
  const userId = formData.get("userId") as string
  const agencyId = formData.get("agencyId") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  // Basic authorization check: ensure the current user is an admin or agency admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || (profile?.role !== "agency" && profile?.role !== "admin")) {
    return { success: false, message: "Unauthorized access." }
  }

  // Ensure the agency_id matches if the user is an agency admin
  if (profile.role === "agency" && profile.agency_id !== agencyId) {
    return { success: false, message: "Unauthorized to manage users for this agency." }
  }

  try {
    if (actionType === "create") {
      // Create a new user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            agency_id: agencyId,
          },
        },
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        return { success: false, message: `Erro ao criar usuário: ${authError.message}` }
      }

      // If auth user created, a profile should be automatically created via trigger
      // We can optionally verify or add more profile data here if needed
      return { success: true, message: "Usuário adicionado com sucesso!" }
    } else if (actionType === "update") {
      // Update user profile
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email: email, role: role })
        .eq("id", userId)

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError)
        return { success: false, message: `Erro ao atualizar perfil: ${updateProfileError.message}` }
      }

      // Optionally update auth email if changed (requires re-authentication or admin privileges)
      // For simplicity, we're only updating the profile table here.
      // If email change is critical, consider using admin.updateUserById or a more robust flow.

      return { success: true, message: "Usuário atualizado com sucesso!" }
    } else if (actionType === "delete") {
      // Delete user from profiles table (and potentially auth if cascade is set up or using admin client)
      // For simplicity, we'll delete from profiles. Deleting from auth.users requires service_role_key
      // or a specific Supabase function.
      const { error: deleteProfileError } = await supabase.from("profiles").delete().eq("id", userId)

      if (deleteProfileError) {
        console.error("Error deleting profile:", deleteProfileError)
        return { success: false, message: `Erro ao remover usuário: ${deleteProfileError.message}` }
      }

      // To delete from auth.users, you'd typically need the service_role_key on the server
      // const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      // if (deleteAuthError) { /* handle error */ }

      return { success: true, message: "Usuário removido com sucesso!" }
    }
  } catch (error: any) {
    console.error("Unhandled error in manageAgencyUser:", error)
    return { success: false, message: `Ocorreu um erro inesperado: ${error.message}` }
  } finally {
    revalidatePath("/dashboard/agency/manage-users")
  }
}
