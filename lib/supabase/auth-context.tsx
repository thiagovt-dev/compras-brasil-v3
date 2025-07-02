"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "./client";
import { getSession } from "@/lib/supabase/auth-utils";

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Timeout de segurança para garantir que o loading não fique infinito
  useEffect(() => {
    // Sincroniza cookie se só existir localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sb-jfbuistvgwkfpnujygwx-auth-token");
      const hasCookie = document.cookie.includes("sb-jfbuistvgwkfpnujygwx-auth-token");
      if (token && !hasCookie) {
        try {
          const parsed = JSON.parse(token);
          // Reescreve o cookie manualmente
          document.cookie = `sb-jfbuistvgwkfpnujygwx-auth-token=${encodeURIComponent(
            token
          )}; path=/; expires=${new Date(parsed.expires_at * 1000).toUTCString()}`;
          console.log("🔄 Cookie de auth sincronizado manualmente com localStorage");
        } catch (e) {
          // Se der erro no parse, limpa tudo
          localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
        }
      }
    }
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout reached, forcing loading to false");
        setIsLoading(false);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [isLoading]);

    useEffect(() => {
      const getInitialSession = async () => {
        setIsLoading(true);
        try {
          // Limpar possíveis dados corrompidos do localStorage
          try {
            const storedSession = localStorage.getItem("sb-jfbuistvgwkfpnujygwx-auth-token");
            if (storedSession) {
              try {
                const parsed = JSON.parse(storedSession);
                if (parsed.expires_at && new Date(parsed.expires_at * 1000) < new Date()) {
                  localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
                }
              } catch {
                // JSON inválido, remove mesmo assim
                localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
              }
            }
          } catch {
            localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
          }
  
          const session = await getSession();
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          setProfile(null);
        } finally {
          setIsLoading(false); // <-- SEMPRE FINALIZA O LOADING
        }
      };
  
      getInitialSession();
  
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsLoading(true);
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        } finally {
          setIsLoading(false); // <-- SEMPRE FINALIZA O LOADING
        }
      });
  
      return () => subscription.unsubscribe();
    }, [supabase]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Set profile to null instead of keeping undefined
        setProfile(null);
        return null;
      } else {
        console.log("Profile fetched successfully:", data);
        setProfile(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      return null;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("🚀 Iniciando signUp:", { email, userData });

      // First, create the user in Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            profile_type: userData.profile_type,
          },
          emailRedirectTo: `${window.location.origin}/api/auth`,
        },
      });

      if (error) {
        console.error("❌ Erro no auth signUp:", error);
        throw error;
      }

      console.log("✅ Auth user criado:", data.user?.id);

      if (data.user) {
        console.log("📝 Criando profile via API...");

        // Call our API route to create the profile
        const response = await fetch("/api/create-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: data.user.id,
            userData: userData,
          }),
        });

        console.log("📤 Response status:", response.status);

        const responseText = await response.text();
        console.log("📄 Response text:", responseText);

        if (!response.ok) {
          let errorMessage = "Failed to create profile";
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = responseText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        try {
          const responseData = JSON.parse(responseText);
          console.log("✅ Profile criado via API:", responseData);
        } catch {
          console.warn("⚠️ Response não é JSON válido, mas status OK");
        }
      }

      return data;
    } catch (error) {
      console.error("💥 Error signing up:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔐 Tentando sign in com email:", email);

      if (error) {
        throw error;
      }

      // Fetch profile after sign in and wait for it
      if (data.user) {
        console.log("🔍 Buscando profile do usuário:", data.user.id);

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("❌ Erro ao buscar profile:", profileError);
        } else {
          console.log("✅ Profile encontrado:", userProfile);
          setProfile(userProfile);

          // Redirect based on agency_id/supplier_id first, then profile_type
          if (userProfile?.agency_id) {
            console.log("🏢 Usuário tem agency_id, redirecionando para /dashboard/agency");
            router.push("/dashboard/agency");
          } else if (userProfile?.supplier_id) {
            console.log("🏭 Usuário tem supplier_id, redirecionando para /dashboard/supplier");
            router.push("/dashboard/supplier");
          } else if (userProfile?.profile_type === "admin") {
            console.log("👑 Usuário é admin, redirecionando para /dashboard/admin");
            router.push("/dashboard/admin");
          } else {
            console.log("👤 Usuário é citizen, redirecionando para /dashboard/citizen");
            router.push("/dashboard/citizen");
          }
        }
      }

      return data;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithEmailOrDocument = async (
    emailOrDocument: string,
    password: string,
    inputType: string
  ) => {
    try {
      let email = emailOrDocument;

      // Se não é email, buscar o email pelo documento
      if (inputType !== "email") {
        const documentField = inputType === "cpf" ? "cpf" : "cnpj";
        const cleanDocument = emailOrDocument.replace(/[^\d]/g, "");

        console.log(`Buscando email para ${documentField}:`, cleanDocument);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq(documentField, cleanDocument)
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          throw new Error("Documento não encontrado. Verifique se está cadastrado.");
        }

        if (!profile || !profile.email) {
          throw new Error("Email não encontrado para este documento.");
        }

        email = profile.email;
        console.log("Email encontrado:", email);
      }

      // Fazer login com o email encontrado
      console.log("Tentando login com email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro no login:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error signing in with email or document:", error);
      throw error;
    }
  };
  const signOut = async () => {
    try {
      console.log("Signing out user:", user?.id);
  
      // Limpa todos os cookies possíveis
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${window.location.pathname}`;
      });
  
      localStorage.removeItem("sb-jfbuistvgwkfpnujygwx-auth-token");
  
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const value = {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signInWithEmailOrDocument,
    signOut,
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
