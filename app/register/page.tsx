"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/supabase/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()
  const { toast } = useToast()

  const defaultType = searchParams.get("type") || ""

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    cnpj: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    profile_type: defaultType,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Format functions
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "cpf") {
      setFormData({ ...formData, [name]: formatCPF(value) })
    } else if (name === "cnpj") {
      setFormData({ ...formData, [name]: formatCNPJ(value) })
    } else if (name === "phone") {
      setFormData({ ...formData, [name]: formatPhone(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleProfileChange = (value: string) => {
    setFormData({ ...formData, profile_type: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Validate profile selection
      if (!formData.profile_type) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um perfil",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Validate required fields based on profile type
      if (formData.profile_type === "supplier" || formData.profile_type === "agency") {
        if (!formData.cnpj || !formData.company_name) {
          toast({
            title: "Erro",
            description: "CNPJ e Nome da Empresa são obrigatórios para este perfil",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      } else if (!formData.cpf) {
        toast({
          title: "Erro",
          description: "CPF é obrigatório para este perfil",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Register user with Supabase
      await signUp(formData.email, formData.password, formData)

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Você será redirecionado para a página de login",
      })

      // Redirect to login page
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao processar seu cadastro",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isOrganization = formData.profile_type === "supplier" || formData.profile_type === "agency"

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
              <div className="space-y-2">
                <Label htmlFor="profile_type" className="font-gabarito font-medium">
                  Perfil
                </Label>
                <Select onValueChange={handleProfileChange} value={formData.profile_type}>
                  <SelectTrigger id="profile_type">
                    <SelectValue placeholder="Selecione seu perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Cidadão</SelectItem>
                    <SelectItem value="supplier">Fornecedor</SelectItem>
                    <SelectItem value="agency">Órgão Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {isOrganization ? (
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="font-gabarito font-medium">
                      CNPJ
                    </Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={handleChange}
                      maxLength={18}
                      required
                      className="font-gabarito"
                    />
                  </div>
                ) : (
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
                      className="font-gabarito"
                    />
                  </div>
                )}

                {isOrganization && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company_name" className="font-gabarito font-medium">
                      Nome da Empresa/Órgão
                    </Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      placeholder="Digite o nome da empresa ou órgão"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      className="font-gabarito"
                    />
                  </div>
                )}

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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="font-gabarito font-medium">
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Digite seu endereço completo"
                    value={formData.address}
                    onChange={handleChange}
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
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 font-gabarito">
                    A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-canal-blue hover:bg-canal-blue/90 font-gabarito font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar"}
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
  )
}
