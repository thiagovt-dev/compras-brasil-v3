"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { detectDocumentType } from "@/lib/utils/document-utils";
import { signInWithEmailOrDocument } from "@/lib/supabase/auth-utils";
import { clearAuthData } from "@/lib/auth-debug";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, session, profile, isLoading } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  const [inputError, setInputError] = useState("");

  const [emailOrDocument, setEmailOrDocument] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para redirecionar baseado no perfil
  const redirectToDashboard = (profile: any) => {
    let route = "/dashboard/citizen"; // default

    if (profile?.agency_id) {
      route = "/dashboard/agency";
    } else if (profile?.supplier_id) {
      route = "/dashboard/supplier";
    } else {
      const dashboardRoutes = {
        citizen: "/dashboard/citizen",
        supplier: "/dashboard/supplier",
        agency: "/dashboard/agency",
        admin: "/dashboard/admin",
        support: "/dashboard/support",
        registration: "/dashboard/registration",
      };
      route =
        dashboardRoutes[profile?.profile_type as keyof typeof dashboardRoutes] ||
        "/dashboard/citizen";
    }

    console.log(`🔄 Redirecionando para: ${route}`);
    router.replace(route);
  };

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!isLoading && session && profile) {
      redirectToDashboard(profile);
    }
  }, [session, profile, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Limpa tokens/cookies antigos antes de tentar login
    clearAuthData();

    const inputType = detectDocumentType(emailOrDocument);
    if (inputType === "invalid") {
      setInputError("Formato inválido. Use email, CPF ou CNPJ válido.");
      setIsSubmitting(false);
      return;
    }
    setInputError("");

    try {
      let result;
      if (inputType === "email") {
        // Login direto com email
        result = await signIn(emailOrDocument, password);
      } else {
        // Login com documento (busca email primeiro)
        result = await signInWithEmailOrDocument(emailOrDocument, password, inputType);
      }

      const { session, user } = result;

      if (session && user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Você será redirecionado para o painel",
        });

        // Fetch user profile to determine dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_type, agency_id, supplier_id")
          .eq("id", user.id)
          .single();

        // Redirect to appropriate dashboard based on user role
        if (profile) {
          redirectToDashboard(profile);
        } else {
          redirectToDashboard({ profile_type: "citizen" }); // Default dashboard
        }
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      let errorMessage = "Verifique suas credenciais e tente novamente";
      if (
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("email not confirmed")
      ) {
        errorMessage = "Email não confirmado, por favor verifique sua caixa de emails.";
      }
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading se estiver carregando
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se já estiver logado, mostrar loading de redirecionamento
  if (session && profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Redirecionando para seu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-canal-compras.png" alt="Canal de Compras Brasil" className="h-12" />
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
            <CardDescription>Acesse sua conta com email ou documento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrDocument">E-mail ou Documento</Label>
                <Input
                  id="emailOrDocument"
                  placeholder="seu@email.com ou CPF/CNPJ"
                  value={emailOrDocument}
                  onChange={(e) => setEmailOrDocument(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                {inputError && <div className="text-red-500 text-sm">{inputError}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center text-[1rem]">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}