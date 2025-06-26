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
      console.log(`🔍 Buscando email para ${inputType}:`, emailOrDocument);

      const cleanDoc = cleanDocument(emailOrDocument);
      const formattedDoc = formatDocument(cleanDoc, inputType);

      console.log("📄 Documento original:", emailOrDocument);
      console.log("📄 Documento limpo:", cleanDoc);
      console.log("📄 Documento formatado:", formattedDoc);

      // Buscar na tabela profiles pelo documento formatado (como está salvo no banco)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email, name, id, cpf, cnpj")
        .eq(inputType === "cpf" ? "cpf" : "cnpj", formattedDoc);

      console.log("📊 Resultado da busca:", { profiles, error: profileError });

      if (profileError) {
        console.error("❌ Erro ao buscar perfil:", profileError);
        throw new Error(`Erro na busca: ${profileError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        console.error("❌ Nenhum perfil encontrado para o documento formatado:", formattedDoc);

        // Tentar buscar também sem formatação como fallback
        console.log("🔄 Tentando buscar sem formatação:", cleanDoc);
        const { data: profilesClean, error: profileErrorClean } = await supabase
          .from("profiles")
          .select("email, name, id, cpf, cnpj")
          .eq(inputType === "cpf" ? "cpf" : "cnpj", cleanDoc);

        console.log("📊 Resultado da busca sem formatação:", {
          profilesClean,
          error: profileErrorClean,
        });

        if (!profilesClean || profilesClean.length === 0) {
          throw new Error("Documento não encontrado. Verifique se você possui cadastro.");
        }

        // Usar resultado da busca sem formatação
        const profile = profilesClean[0];
        if (!profile.email) {
          throw new Error("Perfil encontrado mas sem email associado");
        }

        email = profile.email;
        console.log(
          "✅ Email encontrado (busca sem formatação):",
          email,
          "para usuário:",
          profile.name
        );
      } else {
        if (profiles.length > 1) {
          console.warn("⚠️ Múltiplos perfis encontrados para o documento:", formattedDoc);
          console.log("📋 Perfis encontrados:", profiles);
        }

        const profile = profiles[0];
        if (!profile.email) {
          throw new Error("Perfil encontrado mas sem email associado");
        }

        email = profile.email;
        console.log("✅ Email encontrado:", email, "para usuário:", profile.name);
      }
    }

    // Fazer login com o email
    console.log("🔐 Fazendo login com email:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Erro no login:", error);
      throw new Error(`Erro na autenticação: ${error.message}`);
    }

    if (!data.session || !data.user) {
      throw new Error("Falha na autenticação - sessão não criada");
    }

    console.log("✅ Login realizado com sucesso para:", data.user.email);
    return {
      session: data.session,
      user: data.user,
    };
  } catch (error) {
    console.error("❌ Erro em signInWithEmailOrDocument:", error);
    throw error;
  }
}

export async function getSession() {
  try {
    const supabase = getSupabaseClient();

    // Adicionar timeout para evitar travamento
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Session timeout")), 5000)
    );

    const {
      data: { session },
      error,
    } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

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
