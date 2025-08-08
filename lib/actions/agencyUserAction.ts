"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createClient } from "@supabase/supabase-js";
import { getSessionWithProfile, signUpAction } from "./authAction";

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

export async function fetchAgencyUsers() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Verificar se é usuário de órgão ou admin
    if (!["agency", "admin"].includes(sessionData.profile?.profile_type || "")) {
      throw new ServerActionError("Acesso negado: apenas usuários de órgão ou administradores podem acessar", 403);
    }

    // Verificar se tem agency_id
    if (!sessionData.profile?.agency_id) {
      console.log("Usuário não tem agency_id, retornando lista vazia");
      return [];
    }

    console.log("🔍 Buscando usuários do órgão:", sessionData.profile.agency_id);

    // Buscar usuários do órgão (exceto o usuário atual)
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, name, email, profile_type, created_at")
      .eq("agency_id", sessionData.profile.agency_id)
      .neq("id", sessionData.user.id) // Excluir o usuário atual
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar usuários:", error);
      throw new ServerActionError(`Erro ao buscar usuários: ${error.message}`, 500);
    }

    console.log("✅ Usuários encontrados:", users?.length || 0);
    return users || [];
  });
}

export async function createAgencyUser(formData: FormData) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Verificar se é usuário de órgão ou admin
    if (!["agency", "admin"].includes(sessionData.profile?.profile_type || "")) {
      throw new ServerActionError("Acesso negado: apenas usuários de órgão ou administradores podem criar usuários", 403);
    }

    // Verificar se tem agency_id
    if (!sessionData.profile?.agency_id) {
      throw new ServerActionError("Usuário não está vinculado a um órgão", 400);
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const profile_type = formData.get("profile_type") as string;

    // Validar dados obrigatórios
    if (!name || !email || !password || !profile_type) {
      throw new ServerActionError("Todos os campos são obrigatórios", 400);
    }

    console.log("👤 Criando usuário:", email, "para órgão:", sessionData.profile.agency_id);

    // Criar usuário usando signUpAction
    const signUpResult = await signUpAction({
      email,
      password,
      name,
      profile_type,
      cpf: "", // CPF vazio para usuários de órgão
    });

    if (!signUpResult.success || !signUpResult.data?.user?.id) {
      throw new ServerActionError(signUpResult.error || "Erro ao criar usuário", 500);
    }

    // Atualizar perfil com agency_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        agency_id: sessionData.profile.agency_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signUpResult.data.user.id);

    if (updateError) {
      console.error("Erro ao atualizar perfil com agency_id:", updateError);
      throw new ServerActionError("Erro ao vincular usuário ao órgão", 500);
    }

    console.log("✅ Usuário criado com sucesso:", email);

    // Retornar dados do usuário criado
    return {
      id: signUpResult.data.user.id,
      name,
      email,
      profile_type,
      created_at: new Date().toISOString(),
    };
  });
}

export async function updateAgencyUser(userId: string, formData: FormData) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Verificar se é usuário de órgão ou admin
    if (!["agency", "admin"].includes(sessionData.profile?.profile_type || "")) {
      throw new ServerActionError("Acesso negado: apenas usuários de órgão ou administradores podem editar usuários", 403);
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const profile_type = formData.get("profile_type") as string;

    // Validar dados obrigatórios
    if (!name || !email || !profile_type) {
      throw new ServerActionError("Todos os campos são obrigatórios", 400);
    }

    console.log("📝 Atualizando usuário:", userId);

    // Verificar se o usuário pertence ao mesmo órgão
    const { data: userToUpdate, error: fetchError } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (fetchError) {
      throw new ServerActionError("Usuário não encontrado", 404);
    }

    if (userToUpdate.agency_id !== sessionData.profile?.agency_id) {
      throw new ServerActionError("Você não pode editar usuários de outros órgãos", 403);
    }

    // Atualizar usuário
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        email,
        profile_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Erro ao atualizar usuário:", updateError);
      throw new ServerActionError(`Erro ao atualizar usuário: ${updateError.message}`, 500);
    }

    console.log("✅ Usuário atualizado com sucesso:", userId);

    return {
      id: userId,
      name,
      email,
      profile_type,
    };
  });
}

export async function deleteAgencyUser(userId: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Verificar se é usuário de órgão ou admin
    if (!["agency", "admin"].includes(sessionData.profile?.profile_type || "")) {
      throw new ServerActionError("Acesso negado: apenas usuários de órgão ou administradores podem remover usuários", 403);
    }

    console.log("🗑️ Removendo usuário:", userId);

    // Verificar se o usuário pertence ao mesmo órgão
    const { data: userToDelete, error: fetchError } = await supabase
      .from("profiles")
      .select("agency_id, name")
      .eq("id", userId)
      .single();

    if (fetchError) {
      throw new ServerActionError("Usuário não encontrado", 404);
    }

    if (userToDelete.agency_id !== sessionData.profile?.agency_id) {
      throw new ServerActionError("Você não pode remover usuários de outros órgãos", 403);
    }

    // Remover usuário do perfil (isso também remove da autenticação via RLS)
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Erro ao remover usuário:", deleteError);
      throw new ServerActionError(`Erro ao remover usuário: ${deleteError.message}`, 500);
    }

    console.log("✅ Usuário removido com sucesso:", userToDelete.name);

    return { success: true };
  });
}

export async function getAgencyInfo() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    return {
      user: sessionData.user,
      profile: sessionData.profile,
      isAgencyUser: ["agency", "admin"].includes(sessionData.profile?.profile_type || ""),
      hasAgency: !!sessionData.profile?.agency_id,
    };
  });
}