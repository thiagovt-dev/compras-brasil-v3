"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "./client-singleton"

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (emailOrDocument: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Adicionar delay para evitar rate limit
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)

        // Se for rate limit, tentar novamente
        if (error.message?.includes("Too Many") && retryCount < 3) {
          console.log(`Rate limit detectado, tentando novamente em ${retryCount + 1}s...`)
          return await fetchProfile(userId, retryCount + 1)
        }

        // Criar perfil básico se não encontrar
        return {
          id: userId,
          profile_type: "supplier",
          name: "Usuário",
          email: user?.email || "",
        }
      }

      return data
    } catch (error) {
      console.error("Erro inesperado ao buscar perfil:", error)

      // Retornar perfil básico em caso de erro
      return {
        id: userId,
        profile_type: "supplier",
        name: "Usuário",
        email: user?.email || "",
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }

      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else if (event === "SIGNED_OUT") {
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

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

  const signIn = async (emailOrDocument: string, password: string) => {
    let email = emailOrDocument

    // Se não é email, buscar email pelo documento
    if (!emailOrDocument.includes("@")) {
      const cleanDocument = emailOrDocument.replace(/[^\d]/g, "")
      const documentField = cleanDocument.length <= 11 ? "cpf" : "cnpj"

      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("email")
          .eq(documentField, cleanDocument)
          .single()

        if (error || !profileData?.email) {
          throw new Error("Documento não encontrado")
        }

        email = profileData.email
      } catch (error) {
        throw new Error("Documento não encontrado")
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signOut,
    signUp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
