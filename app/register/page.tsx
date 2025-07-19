"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { formatCPF, formatPhone, formatCEP, validateCPF } from "@/lib/utils/document-utils";
import { useCepLookup } from "@/hooks/use-cep-lookup";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: cepData, loading: cepLoading, error: cepError, fetchCep } = useCepLookup();

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    cep: "",
    address: "",
    city: "",
    state: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cpfError, setCpfError] = useState("");

  useEffect(() => {
    if (cepData && !cepData.erro) {
      setFormData(prev => ({
        ...prev,
        address: cepData.logradouro || "",
        city: cepData.localidade || "",
        state: cepData.uf || "",
      }));
    }
  }, [cepData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "cpf") {
      const formattedCPF = formatCPF(value);
      setFormData({ ...formData, [name]: formattedCPF });
      
      const cleanCPF = value.replace(/\D/g, "");
      if (cleanCPF.length === 11) {
        if (!validateCPF(formattedCPF)) {
          setCpfError("CPF inválido");
        } else {
          setCpfError("");
        }
      } else if (cleanCPF.length > 0) {
        setCpfError("");
      }
    } else if (name === "phone") {
      setFormData({ ...formData, [name]: formatPhone(value) });
    } else if (name === "cep") {
      const formattedCEP = formatCEP(value);
      setFormData({ ...formData, [name]: formattedCEP });
      
      const cleanCEP = value.replace(/\D/g, "");
      if (cleanCEP.length === 8) {
        fetchCep(cleanCEP);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCPF(formData.cpf)) {
      toast({
        title: "Erro",
        description: "CPF inválido. Verifique se o número está correto.",
        variant: "destructive",
      });
      setCpfError("CPF inválido");
      return false;
    }

    if (!formData.name || !formData.cpf || !formData.email || !formData.phone || 
        !formData.cep || !formData.address || !formData.city || !formData.state || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return false;
    }

    const cleanCEP = formData.cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) {
      toast({
        title: "Erro",
        description: "CEP deve ter 8 dígitos",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!validateForm()) {
        return;
      }

      const fullAddress = `${formData.address}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`;

      await signUp(formData.email, formData.password, {
        ...formData,
        address: fullAddress,
        profile_type: "citizen",
      });

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Você será redirecionado para a página de login",
      });

      window.location.href = "/login";
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao processar seu cadastro",
        variant: "destructive",
      });
    }
  };

  const isLoading = authLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-center">
          <Logo showText={false} size="lg" disableLink />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-chakra font-bold text-center text-canal-blue">
              Cadastro - Canal de Compras Brasil
            </CardTitle>
            <CardDescription className="text-center font-gabarito">
              Crie sua conta para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-gabarito font-medium">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="font-gabarito font-medium">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleChange}
                    maxLength={14}
                    required
                    className={`font-gabarito ${cpfError ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {cpfError && (
                    <p className="text-sm text-red-500 font-gabarito">{cpfError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-gabarito font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-gabarito font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={15}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep" className="font-gabarito font-medium">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={handleChange}
                      maxLength={9}
                      required
                      className="font-gabarito"
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                    )}
                    {cepData && !cepData.erro && (
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {cepError && (
                    <p className="text-sm text-red-500 font-gabarito">{cepError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="font-gabarito font-medium">
                    Logradouro
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Rua, Avenida, etc."
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="font-gabarito font-medium">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Digite a cidade"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="font-gabarito font-medium">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="UF"
                    value={formData.state}
                    onChange={handleChange}
                    maxLength={2}
                    required
                    className="font-gabarito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-gabarito font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="font-gabarito"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 font-gabarito">
                    A senha deve conter pelo menos 6 caracteres.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-gabarito font-medium">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="font-gabarito"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-canal-blue hover:bg-canal-blue/90 font-gabarito font-medium"
                disabled={isLoading || !!cpfError}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm font-gabarito">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium text-canal-blue hover:underline">
                Entrar
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}