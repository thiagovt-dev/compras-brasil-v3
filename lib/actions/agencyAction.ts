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

interface AgencyData {
  name: string;
  cnpj: string;
  agency_type: string;
  sphere: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
}

interface AgencyUser {
  name: string;
  email: string;
  cpf: string;
  document: string;
  role: "auctioneer" | "authority" | "agency_support";
}

interface AgencyDocument {
  name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
}

async function createAgencyUser(
  userInfo: AgencyUser,
  agencyId: string,
  tempPassword: string
) {
  try {
    console.log(`👤 Criando usuário: ${userInfo.email}`);

    const userData = {
      name: userInfo.name,
      email: userInfo.email,
      cpf: userInfo.document.replace(/\D/g, ""),
      profile_type: userInfo.role,
      agency_id: agencyId,
    };

    console.log(`📋 Dados do usuário ${userInfo.email}:`, userData);

    const signUpResult = await signUpAction({
      email: userInfo.email,
      password: tempPassword,
      name: userInfo.name,
      profile_type: userInfo.role,
      cpf: userInfo.document.replace(/\D/g, ""),
    });

    if (!signUpResult.success || !signUpResult.data?.user?.id) {
      throw new ServerActionError(signUpResult.error || "Erro ao criar usuário", 500);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        agency_id: agencyId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", signUpResult.data.user.id);

    if (updateError) {
      console.error("Erro ao atualizar perfil com agency_id:", updateError);
    }

    console.log(`✅ Usuário criado com sucesso: ${userInfo.email}`);
    return {
      success: true,
      email: userInfo.email,
      userId: signUpResult.data.user.id,
    };
  } catch (error) {
    console.error(`💥 Erro ao criar usuário ${userInfo.email}:`, error);
    return {
      success: false,
      email: userInfo.email,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function registerAgency({
  agencyData,
  users,
  documents,
  updateCurrentUserProfile = false,
}: {
  agencyData: AgencyData;
  users: AgencyUser[];
  documents: AgencyDocument[];
  updateCurrentUserProfile?: boolean;
}) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    console.log("🚀 Iniciando cadastro do órgão...");

    // Validar dados obrigatórios
    if (!agencyData.name || !agencyData.cnpj || !agencyData.email) {
      throw new ServerActionError("Dados obrigatórios não preenchidos", 400);
    }

    // Criar órgão
    console.log("📝 Inserindo órgão na tabela agencies...");
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        name: agencyData.name,
        cnpj: agencyData.cnpj.replace(/\D/g, ""),
        agency_type: agencyData.agency_type,
        sphere: agencyData.sphere,
        address: agencyData.address,
        email: agencyData.email,
        phone: agencyData.phone.replace(/\D/g, ""),
        website: agencyData.website || null,
        description: agencyData.description || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (agencyError) {
      console.error("Erro ao criar órgão:", agencyError);
      throw new ServerActionError(`Erro ao criar órgão: ${agencyError.message}`, 500);
    }

    if (!agency) {
      throw new ServerActionError("Órgão não foi criado - dados não retornados", 500);
    }

    const agencyId = agency.id;
    console.log("✅ Órgão criado com ID:", agencyId);

    // Atualizar profile do usuário atual se solicitado (agora altera profile_type para 'agency')
    let userProfileUpdated = false;
    if (updateCurrentUserProfile && sessionData.profile?.profile_type === "citizen") {
      console.log("👤 Atualizando agency_id e profile_type do usuário...");

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          agency_id: agencyId,
          profile_type: "agency",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionData.user.id);

      if (updateProfileError) {
        console.error("Erro ao atualizar agency_id/profile_type do usuário:", updateProfileError);
      } else {
        console.log("✅ agency_id e profile_type do usuário atualizados");
        userProfileUpdated = true;
      }
    }

    // Filtrar usuários válidos
    const validUsers = users.filter(
      (userInfo) =>
        userInfo.name?.trim() &&
        userInfo.email?.trim() &&
        userInfo.document?.trim() &&
        userInfo.role
    );

    console.log("👥 Criando usuários:", validUsers.length);

    // Criar usuários sequencialmente
    const userResults = [];
    for (const userInfo of validUsers) {
      // Usar o documento como senha temporária (sem formatação)
      const tempPassword = userInfo.document.replace(/\D/g, "");

      if (tempPassword.length < 6) {
        userResults.push({
          success: false,
          email: userInfo.email,
          error: "Documento deve ter pelo menos 6 dígitos para usar como senha",
        });
        continue;
      }

      const result = await createAgencyUser(userInfo, agencyId, tempPassword);
      userResults.push(result);

      // Pequena pausa entre criações
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Inserir documentos (se houver)
    if (documents.length > 0) {
      console.log("📄 Inserindo documentos...");
      for (const doc of documents) {
        const { error: docError } = await supabase.from("agency_documents").insert({
          agency_id: agencyId,
          user_id: sessionData.user.id,
          ...doc,
        });
        if (docError) {
          console.error("Erro ao inserir documento:", docError);
          // Não falha o processo, apenas loga
        }
      }
    }

    // Contar sucessos e falhas
    const successfulUsers = userResults.filter((result) => result.success);
    const failedUsers = userResults.filter((result) => !result.success);

    console.log(`✅ Usuários criados com sucesso: ${successfulUsers.length}`);
    console.log(`❌ Usuários que falharam: ${failedUsers.length}`);

    return {
      agency,
      userResults: {
        successful: successfulUsers,
        failed: failedUsers,
      },
      userProfileUpdated,
    };
  });
}

export async function fetchAllAgencies() {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new ServerActionError(`Erro ao buscar órgãos: ${error.message}`, 500);
    }

    return data;
  });
}

export async function fetchAgencyById(agencyId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", agencyId)
      .single();

    if (error) {
      throw new ServerActionError(`Erro ao buscar órgão: ${error.message}`, 500);
    }

    return data;
  });
}

export async function fetchAgencyDocuments(agencyId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from("agency_documents")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ServerActionError(`Erro ao buscar documentos do órgão: ${error.message}`, 500);
    }

    return data;
  });
}

export async function updateAgencyStatus(agencyId: string, status: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (sessionData.profile?.profile_type !== "admin") {
      throw new ServerActionError("Acesso negado: apenas administradores podem alterar status", 403);
    }

    const { data, error } = await supabase
      .from("agencies")
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select()
      .single();

    if (error) {
      throw new ServerActionError(`Erro ao atualizar status do órgão: ${error.message}`, 500);
    }

    if (status === "active") {
      const { error: updateProfilesError } = await supabase
      .from("profiles")
      .update({ 
        profile_type: "agency",
        updated_at: new Date().toISOString(),
      })
      .eq("agency_id", agencyId)
      .eq("profile_type", "citizen");

      if (updateProfilesError) {
      console.error("Erro ao atualizar perfis dos usuários:", updateProfilesError);
      // Não falha o processo
      }
    }

    return data;
  });
}