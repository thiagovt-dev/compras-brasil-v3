"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/lib/supabase/auth-context"
import { createClientSupabaseClient } from "@/lib/supabase/client"

// Esquemas de validação
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const companyFormSchema = z.object({
  company_name: z.string().min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres" }),
  cnpj: z.string().min(14, { message: "CNPJ deve ter pelo menos 14 caracteres" }),
})

const personFormSchema = z.object({
  cpf: z.string().min(11, { message: "CPF deve ter pelo menos 11 caracteres" }),
})

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()
  const { profile, isLoading, user } = useAuth()
  const supabase = createClientSupabaseClient()

  // Formulários
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  })

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: "",
      cnpj: "",
    },
  })

  const personForm = useForm<z.infer<typeof personFormSchema>>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      cpf: "",
    },
  })

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Preencher formulários quando o profile estiver disponível
  useEffect(() => {
    if (profile) {
      // Preencher formulário de perfil
      profileForm.reset({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      })

      // Preencher formulário de empresa
      if (profile.profile_type === "supplier" || profile.profile_type === "agency") {
        companyForm.reset({
          company_name: profile.company_name || "",
          cnpj: profile.cnpj || "",
        })
      }

      // Preencher formulário de pessoa física
      if (profile.profile_type === "citizen") {
        personForm.reset({
          cpf: profile.cpf || "",
        })
      }
    }
  }, [profile, profileForm, companyForm, personForm])

  // Atualizar perfil pessoal
  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas informações pessoais foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar suas informações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Atualizar informações da empresa
  const onCompanySubmit = async (values: z.infer<typeof companyFormSchema>) => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: values.company_name,
          cnpj: values.cnpj,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "Informações da empresa atualizadas",
        description: "Os dados da sua empresa foram atualizados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error)
      toast({
        title: "Erro ao atualizar empresa",
        description: "Ocorreu um erro ao atualizar os dados da empresa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Atualizar informações de pessoa física
  const onPersonSubmit = async (values: z.infer<typeof personFormSchema>) => {
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          cpf: values.cpf,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast({
        title: "CPF atualizado",
        description: "Seu CPF foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar CPF:", error)
      toast({
        title: "Erro ao atualizar CPF",
        description: "Ocorreu um erro ao atualizar seu CPF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Atualizar senha
  const onSecuritySubmit = async (values: z.infer<typeof securityFormSchema>) => {
    if (!user?.email) return

    setLoading(true)
    try {
      // Primeiro, verificar se a senha atual está correta tentando fazer login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      })

      if (verifyError) {
        throw new Error("Senha atual incorreta")
      }

      // Atualizar a senha
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      })

      if (error) throw error

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      })

      // Limpar formulário
      securityForm.reset()
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error)
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Ocorreu um erro ao atualizar sua senha. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading state do AuthContext
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  // Se não há profile mesmo após carregar
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-lg font-medium">Perfil não encontrado</p>
          <p className="text-sm text-muted-foreground">Não foi possível carregar as informações do perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          {(profile.profile_type === "supplier" || profile.profile_type === "agency") && (
            <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
          )}
          {profile.profile_type === "citizen" && <TabsTrigger value="person">Dados Pessoais</TabsTrigger>}
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList> 

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu.email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu endereço" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {(profile.profile_type === "supplier" || profile.profile_type === "agency") && (
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Atualize as informações da sua empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da sua empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {profile.profile_type === "citizen" && (
          <TabsContent value="person" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Atualize seus dados pessoais</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...personForm}>
                  <form onSubmit={personForm.handleSubmit(onPersonSubmit)} className="space-y-4">
                    <FormField
                      control={personForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Digite sua senha atual" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Digite a nova senha" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Confirme a nova senha" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Atualizar Senha
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}