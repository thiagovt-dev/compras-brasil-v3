"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./client-singleton";
import { createClientSupabaseClient } from "./client";

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

  useEffect(() => {
    const getInitialSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial session:", session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // First, create the user in Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            profile_type: userData.profile_type,
            // Include other metadata as needed
          },
          emailRedirectTo: `${window.location.origin}/api/auth`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Call our API route to create the profile using the service role key
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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create profile");
        }
      }

      return data;
    } catch (error) {
      console.error("Error signing up:", error);
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
        throw error;
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
