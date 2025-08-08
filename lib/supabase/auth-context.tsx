// lib/supabase/auth-context.tsx
"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "./client";
import { getSession } from "@/lib/supabase/auth-utils";
import { signUpAction } from "../actions/authAction";
import { fetchProfile } from "../actions/profileAction";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithEmailOrDocument: (
    emailOrDocument: string,
    password: string,
    inputType: string
  ) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CORREÇÃO: Timeout de segurança reduzido com logs
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000); 
    
    return () => clearTimeout(loadingTimeout);
  }, []);

  // Sincronização cookie/localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("sb-jfbuistvgwkfpnujygwx-auth-token");
        const hasCookie = document.cookie.includes("sb-jfbuistvgwkfpnujygwx-auth-token");

        if (token && !hasCookie) {
          const parsed = JSON.parse(token);
          // Verificar se o token não expirou
          if (parsed.expires_at && new Date(parsed.expires_at * 1000) > new Date()) {
            document.cookie = `sb-jfbuistvgwkfpnujygwx-auth-token=${encodeURIComponent(
              token
            )}; path=/; expires=${new Date(parsed.expires_at * 1000).toUTCString()}`;
          } else {
            localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
          }
        }
      } catch (error) {
        console.error("❌ Erro ao sincronizar tokens:", error);
        localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
      }
    }
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const result = await fetchProfile(userId);

      if (result.success && result.data) {
        setProfile(result.data as UserData);
        return result.data;
      } else {
        setProfile(null);
        return null;
      }
    } catch (error) {
      setProfile(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log("🔄 Refreshing profile para usuário:", user.id);
      await loadProfile(user.id);
    }
  };

  // Inicialização e gerenciamento de state
  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      if (!isMounted) return;
      
      try {
        // Limpar tokens expirados
        try {
          const storedSession = localStorage.getItem("sb-jfbuistvgwkfpnujygwx-auth-token");
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            if (parsed.expires_at && new Date(parsed.expires_at * 1000) < new Date()) {
              localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
            }
          }
        } catch {
          localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
        }

        // Buscar sessão atual
        const session = await getSession();

        if (!isMounted) return;

        if (session) {
          
          setSession(session);
          setUser(session.user);

          // Carregar perfil
          await loadProfile(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted && event !== 'TOKEN_REFRESHED') {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const result = await signUpAction({
        email,
        password,
        name: userData.name,
        profile_type: userData.profile_type,
        cpf: userData.cpf,
        cnpj: userData.cnpj,
        phone: userData.phone,
        address: userData.address,
        company_name: userData.company_name,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to register");
      }

      return result.data;
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro no login:", error.message);
        throw error;
      }

      if (data.user) {
        const userProfile = await loadProfile(data.user.id);

        if (userProfile?.agency_id) {
          router.push("/dashboard/agency");
        } else if (userProfile?.supplier_id) {
          router.push("/dashboard/supplier");
        } else if (userProfile?.profile_type === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/citizen");
        }
      }

      return data;
    } catch (error) {
      console.error("❌ Erro fatal no login:", error);
      throw error;
    }
  };

  const signInWithEmailOrDocument = async (
    emailOrDocument: string,
    password: string,
    inputType: string
  ) => {
    try {
      console.log("🔍 Login com documento:", { inputType, document: emailOrDocument });
      let email = emailOrDocument;

      if (inputType !== "email") {
        const documentField = inputType === "cpf" ? "cpf" : "cnpj";
        const cleanDocument = emailOrDocument.replace(/[^\d]/g, "");

        console.log("🔍 Buscando email pelo documento:", cleanDocument);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq(documentField, cleanDocument)
          .single();

        if (profileError) {
          console.error("❌ Documento não encontrado:", profileError);
          throw new Error("Documento não encontrado. Verifique se está cadastrado.");
        }

        if (!profile?.email) {
          console.error("❌ Email não encontrado para documento");
          throw new Error("Email não encontrado para este documento.");
        }

        email = profile.email;
        console.log("✅ Email encontrado para documento:", email);
      }

      return await signIn(email, password);
    } catch (error) {
      console.error("❌ Erro no login com documento:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("👋 Iniciando logout...");
      
      await supabase.auth.signOut();
      
      // Limpar localStorage
      localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
      
      // Limpar todos os cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Limpar state
      setUser(null);
      setSession(null);
      setProfile(null);

      console.log("✅ Logout realizado - redirecionando...");
      window.location.href = "/login";
    } catch (error) {
      console.error("❌ Erro no logout:", error);
      // Limpar state mesmo com erro
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
      window.location.href = "/login";
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("🔐 Enviando reset de senha para:", email);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("❌ Erro ao enviar reset:", error);
        throw error;
      }

      console.log("✅ Email de reset enviado:", data);
    } catch (error) {
      console.error("❌ Erro fatal no reset:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      console.log("🔐 Atualizando senha...");
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("❌ Erro ao atualizar senha:", error);
        throw error;
      }

      console.log("✅ Senha atualizada com sucesso");
    } catch (error) {
      console.error("❌ Erro fatal na atualização de senha:", error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signInWithEmailOrDocument,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}