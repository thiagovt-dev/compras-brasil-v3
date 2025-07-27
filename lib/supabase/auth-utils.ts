import { getSupabaseClient } from "./client-singleton";
import { cleanDocument, formatDocument } from "@/lib/utils/document-utils";

export async function signInWithEmailOrDocument(
  emailOrDocument: string,
  password: string,
  inputType: "email" | "cpf" | "cnpj"
) {
  const supabase = getSupabaseClient();

  try {
    let email = emailOrDocument;

    // Se não for email, buscar o email pelo documento
    if (inputType !== "email") {

      const cleanDoc = cleanDocument(emailOrDocument);
      const formattedDoc = formatDocument(cleanDoc, inputType);


      // Buscar na tabela profiles pelo documento formatado (como está salvo no banco)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email, name, id, cpf, cnpj")
        .eq(inputType === "cpf" ? "cpf" : "cnpj", formattedDoc);


      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        throw new Error(`Erro na busca: ${profileError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        console.error("Nenhum perfil encontrado para o documento formatado:", formattedDoc);

        // Tentar buscar também sem formatação como fallback
        const { data: profilesClean, error: profileErrorClean } = await supabase
          .from("profiles")
          .select("email, name, id, cpf, cnpj")
          .eq(inputType === "cpf" ? "cpf" : "cnpj", cleanDoc);


        if (!profilesClean || profilesClean.length === 0) {
          throw new Error("Documento não encontrado. Verifique se você possui cadastro.");
        }

        // Usar resultado da busca sem formatação
        const profile = profilesClean[0];
        if (!profile.email) {
          throw new Error("Perfil encontrado mas sem email associado");
        }

        email = profile.email;

      } else {

        const profile = profiles[0];
        if (!profile.email) {
          throw new Error("Perfil encontrado mas sem email associado");
        }

        email = profile.email;
      }
    }

    // Fazer login com o email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no login:", error);
      throw new Error(`Erro na autenticação: ${error.message}`);
    }

    if (!data.session || !data.user) {
      throw new Error("Falha na autenticação - sessão não criada");
    }

    return {
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    console.error("Erro em signInWithEmailOrDocument:", error);
    throw error;
  }
}

export async function getSession() {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error in getSession:", error);
    return null;
  }
}

export async function getUser() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
