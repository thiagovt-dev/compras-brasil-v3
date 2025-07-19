"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createProfile } from "./profileAction";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface SignUpData {
  email: string;
  password: string;
  name: string;
  profile_type: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  company_name?: string;
}

interface SessionWithProfile {
  user: any;
  session: any;
  profile: any;
}

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

export async function getSessionWithProfile(): Promise<SessionWithProfile | null> {
  try {
    const serverSupabase = createServerClient();

    const {
      data: { session },
      error: sessionError,
    } = await serverSupabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    const { data: profile, error: profileError } = await serverSupabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return {
        user: session.user,
        session: session,
        profile: null,
      };
    }

    return {
      user: session.user,
      session: session,
      profile: profile,
    };
  } catch (error) {
    console.error("Error getting session with profile:", error);
    return null;
  }
}

export async function requireAgencyUser() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData) {
      redirect("/login");
    }

    if (!sessionData.profile?.agency_id) {
      throw new ServerActionError("Usuário não está vinculado a um órgão público", 403);
    }

    return {
      user: sessionData.user,
      session: sessionData.session,
      profile: sessionData.profile,
      agencyId: sessionData.profile.agency_id,
    };
  });
}

export async function requireSupplierUser() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData) {
      redirect("/login");
    }

    if (!sessionData.profile?.supplier_id) {
      throw new ServerActionError("Usuário não está vinculado a um fornecedor", 403);
    }

    return {
      user: sessionData.user,
      session: sessionData.session,
      profile: sessionData.profile,
      supplierId: sessionData.profile.supplier_id,
    };
  });
}

export async function requireAdminUser() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData) {
      redirect("/login");
    }

    if (sessionData.profile?.profile_type !== "admin") {
      throw new ServerActionError("Usuário não possui permissões de administrador", 403);
    }

    return {
      user: sessionData.user,
      session: sessionData.session,
      profile: sessionData.profile,
    };
  });
}

export async function signUpAction(userData: SignUpData) {
  return withErrorHandling(async () => {
    if (!userData.email || !userData.password || !userData.name) {
      throw new ServerActionError("Email, senha e nome são obrigatórios", 400);
    }

    if (userData.password.length < 6) {
      throw new ServerActionError("A senha deve ter pelo menos 6 caracteres", 400);
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          profile_type: userData.profile_type,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/auth`,
      },
    });

    if (authError) {
      console.error("Erro no auth signUp:", authError);

      if (authError.message.includes("already registered")) {
        throw new ServerActionError("Este email já está cadastrado", 409);
      } else if (authError.message.includes("invalid email")) {
        throw new ServerActionError("Email inválido", 400);
      } else {
        throw new ServerActionError(`Erro ao criar usuário: ${authError.message}`, 500);
      }
    }

    if (!authData.user) {
      throw new ServerActionError("Falha ao criar usuário", 500);
    }

    const profileResult = await createProfile(authData.user.id, userData);

    if (!profileResult.success) {
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error("Erro ao limpar usuário:", deleteError);
      }

      throw new ServerActionError(profileResult.error || "Erro ao criar perfil", 500);
    }
    return {
      user: authData.user,
      profile: profileResult.data,
    };
  });
}

export async function signInAction(email: string, password: string) {
  return withErrorHandling(async () => {
    if (!email || !password) {
      throw new ServerActionError("Email e senha são obrigatórios", 400);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new ServerActionError("Configuração do Supabase não encontrada", 500);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no sign in:", error);

      if (error.message.includes("Invalid login credentials")) {
        throw new ServerActionError("Email ou senha incorretos", 401);
      } else if (error.message.includes("Email not confirmed")) {
        throw new ServerActionError("Email não confirmado", 401);
      } else {
        throw new ServerActionError(`Erro ao fazer login: ${error.message}`, 500);
      }
    }

    if (!data.user) {
      throw new ServerActionError("Falha na autenticação", 500);
    }

    return {
      user: data.user,
      session: data.session,
    };
  });
}
