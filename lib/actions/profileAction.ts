"use server";

import { createClient } from "@supabase/supabase-js";
import { withErrorHandling, ServerActionError } from "./errorAction";
import { createServerClient } from "@/lib/supabase/server";

interface UserData {
  email: string;
  name: string;
  profile_type: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  agency_id?: string;
  supplier_id?: string;
  company_name?: string;
}

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
const supabase = createServerActionClient();

export async function createProfile(userId: string, userData: UserData) {
  return withErrorHandling(async () => {
    if (!userId || !userData) {
      throw new ServerActionError("Missing user ID or user data", 400);
    }

    if (!userData.email || !userData.name || !userData.profile_type) {
      throw new ServerActionError("Email, name and profile_type are required", 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        profile_type: userData.profile_type,
        cpf: userData.cpf || null,
        cnpj: userData.cnpj || null,
        phone: userData.phone || null,
        address: userData.address || null,
        company_name: userData.company_name || null,
        agency_id: userData.agency_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);

      if (profileError.code === "23505") {
        throw new ServerActionError("Um perfil com este ID já existe", 409);
      } else if (profileError.code === "42501") {
        throw new ServerActionError("Permissões insuficientes para criar perfil", 403);
      } else {
        throw new ServerActionError(`Erro ao criar perfil: ${profileError.message}`, 500);
      }
    }

    return profile;
  });
}

export async function fetchProfile(userId: string) {
  return withErrorHandling(async () => {
    if (!userId) {
      throw new ServerActionError("User ID is required", 400);
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);

      if (error.code === "PGRST116") {
        throw new ServerActionError("Perfil não encontrado", 404);
      } else {
        throw new ServerActionError(`Erro ao buscar perfil: ${error.message}`, 500);
      }
    }

    return profile;
  });
}

export async function updateProfile(userId: string, updateData: Partial<UserData>) {
  return withErrorHandling(async () => {
    if (!userId) {
      throw new ServerActionError("User ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ServerActionError("Update data is required", 400);
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw new ServerActionError(`Erro ao atualizar perfil: ${error.message}`, 500);
    }

    return profile;
  });
}

export async function fetchProfileByEmail(email: string) {
  return withErrorHandling(async () => {
    if (!email) {
      throw new ServerActionError("Email is required", 400);
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error fetching profile by email:", error);

      if (error.code === "PGRST116") {
        throw new ServerActionError("Perfil não encontrado", 404);
      } else {
        throw new ServerActionError(`Erro ao buscar perfil: ${error.message}`, 500);
      }
    }

    return profile;
  });
}
