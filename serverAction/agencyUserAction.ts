"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createAgencyUser(formData: FormData) {
  try {
    // Pegar o token que vamos passar do cliente
    const access_token = formData.get("access_token") as string
    const user_id = formData.get("user_id") as string

    if (!access_token || !user_id) {
      return { success: false, error: "Token de acesso não fornecido" }
    }

    const supabase = createServerClient()

    // Verificar se o token é válido
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(access_token)

    if (userError || !user || user.id !== user_id) {
      return { success: false, error: "Token inválido ou usuário não autorizado" }
    }

    const name = formData.get("name") as string // Alterado de fullName para name
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const profile_type = formData.get("profile_type") as string

    if (!name || !email || !password || !profile_type) {
      // Alterado de fullName para name
      return { success: false, error: "Todos os campos são obrigatórios" }
    }

    // Get current user profile
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("profile_type, agency_id")
      .eq("id", user.id)
      .single()

    console.log("Current profile:", currentProfile)

    if (profileError || !currentProfile) {
      return { success: false, error: "Perfil não encontrado" }
    }

    if (currentProfile.profile_type !== "agency" && currentProfile.profile_type !== "admin") {
      return { success: false, error: "Permissões insuficientes" }
    }

    if (!currentProfile.agency_id) {
      return { success: false, error: "Usuário não possui agency_id definido" }
    }

    console.log("Creating auth user...")

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    console.log("Auth user result:", { authUser, authError })

    if (authError || !authUser.user) {
      return { success: false, error: authError?.message || "Falha ao criar usuário" }
    }

    console.log("Creating profile...")

    // Create profile entry
    const { error: newProfileError } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      name: name, // Alterado de fullName para name
      email: email,
      profile_type: profile_type,
      agency_id: currentProfile.agency_id,
    })

    console.log("Profile creation result:", newProfileError)

    if (newProfileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { success: false, error: newProfileError.message }
    }

    console.log("User created successfully!")

    revalidatePath("/dashboard/agency/manage-users")
    return {
      success: true,
      user: {
        id: authUser.user.id,
        name: name, // Alterado de fullName para name
        email: email,
        profile_type: profile_type,
      },
    }
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
