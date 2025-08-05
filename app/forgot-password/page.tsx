"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/hooks/use-toast";
import { detectDocumentType } from "@/lib/utils/document-utils";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  
  const [emailOrDocument, setEmailOrDocument] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let email = emailOrDocument;
      
      // Se não for email, buscar email pelo documento
      const inputType = detectDocumentType(emailOrDocument);
      
      if (inputType !== "email" && inputType !== "invalid") {
        const documentField = inputType === "cpf" ? "cpf" : "cnpj";
        const cleanDocument = emailOrDocument.replace(/[^\d]/g, "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq(documentField, cleanDocument)
          .single();

        if (profileError || !profile?.email) {
          throw new Error("Documento não encontrado. Verifique se está cadastrado.");
        }

        email = profile.email;
      } else if (inputType === "invalid") {
        throw new Error("Formato inválido. Use email, CPF ou CNPJ válido.");
      }

      await resetPassword(email);
      
      setIsSuccess(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error("Erro ao solicitar reset:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar email de recuperação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
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
              <CardTitle className="text-2xl font-bold">Email Enviado!</CardTitle>
              <CardDescription>
                Verifique sua caixa de entrada e spam para o link de redefinição de senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
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
            <CardTitle className="text-2xl font-bold">Esqueceu a senha?</CardTitle>
            <CardDescription>
              Digite seu email ou documento para receber um link de redefinição
            </CardDescription>
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
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}