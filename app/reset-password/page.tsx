"use client";

import React, { useState, useEffect } from "react";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // Função para extrair parâmetros do hash da URL
  const getHashParams = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_at: params.get('expires_at'),
      token_type: params.get('token_type'),
      type: params.get('type')
    };
  };

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Captura os parâmetros do hash da URL
        const hashParams = getHashParams();
        
        console.log('Hash params:', hashParams);
        console.log('Full URL:', window.location.href);

        const { access_token, refresh_token, type } = hashParams;

        if (!access_token || type !== 'recovery') {
          setHasValidToken(false);
          setIsValidating(false);
          toast({
            title: "Link inválido",
            description: "Token de acesso não encontrado ou tipo inválido na URL.",
            variant: "destructive",
          });
          return;
        }

        // Estabelece a sessão usando os tokens do hash
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || ''
        });

        console.log('Set session result:', { data, error });

        if (error) {
          console.error('Error setting session:', error);
          toast({
            title: "Link inválido",
            description: "Erro ao processar o link de redefinição.",
            variant: "destructive",
          });
          setHasValidToken(false);
          return;
        }

        if (data.session) {
          setHasValidToken(true);
          toast({
            title: "Link válido",
            description: "Agora você pode definir sua nova senha.",
          });
          
          // Limpa o hash da URL por segurança
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setHasValidToken(false);
          toast({
            title: "Erro",
            description: "Não foi possível estabelecer uma sessão válida.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error validating token:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar o link de recuperação.",
          variant: "destructive",
        });
        setHasValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [supabase, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi redefinida com sucesso!",
      });
      
      // Aguarda um pouco antes de redirecionar
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar senha.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostra loading enquanto valida o token
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Validando link de recuperação...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se o token não é válido
  if (!hasValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Link Inválido ou Expirado</CardTitle>
              <CardDescription>
                O link de redefinição é inválido, expirou ou já foi usado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Solicitar Novo Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de redefinição de senha
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
            <CardTitle className="text-2xl font-bold">Nova Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}