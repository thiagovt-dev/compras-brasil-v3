"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Smartphone } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("notifications")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    browser: true,
    sms: false,
    newTenders: true,
    deadlines: true,
    results: true,
    documents: true,
    system: true,
  })
  
  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
  })
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  })

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleAccountChange = (key: string, value: string) => {
    setAccountSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveNotificationSettings = () => {
    setIsSubmitting(true)
    
    // Simula chamada API
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Configurações salvas",
        description: "Suas preferências de notificação foram atualizadas com sucesso.",
      })
    }, 1000)
  }

  const saveAccountSettings = () => {
    setIsSubmitting(true)
    
    // Simula chamada API
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de conta foram atualizadas com sucesso.",
      })
    }, 1000)
  }

  const saveSecuritySettings = () => {
    setIsSubmitting(true)
    
    // Validação das senhas
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setIsSubmitting(false)
      toast({
        title: "Erro",
        description: "As senhas não coincidem. Por favor, verifique e tente novamente.",
        variant: "destructive",
      })
      return
    }
    
    // Simula chamada API
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de segurança foram atualizadas com sucesso.",
      })
      
      // Limpa os campos de senha
      setSecuritySettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações de conta</p>
      </div>

      <Tabs defaultValue="notifications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como deseja receber notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Canais de Notificação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                        <span>Notificações por Email</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receba atualizações sobre licitações e prazos por email
                        </span>
                      </Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("email", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="browser-notifications" className="flex flex-col space-y-1">
                        <span>Notificações no Navegador</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receba notificações no navegador quando estiver usando o sistema
                        </span>
                      </Label>
                    </div>
                    <Switch
                      id="browser-notifications"
                      checked={notificationSettings.browser}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("browser", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                        <span>Notificações por SMS</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receba notificações importantes por SMS
                        </span>
                      </Label>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("sms", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tipos de Notificação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="new-tenders">Novas Licitações</Label>
                    <Switch
                      id="new-tenders"
                      checked={notificationSettings.newTenders}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("newTenders", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="deadlines">Prazos e Datas Importantes</Label>
                    <Switch
                      id="deadlines"
                      checked={notificationSettings.deadlines}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("deadlines", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="results">Resultados de Licitações</Label>
                    <Switch
                      id="results"
                      checked={notificationSettings.results}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("results", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="documents">Atualizações de Documentos</Label>
                    <Switch
                      id="documents"
                      checked={notificationSettings.documents}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("documents", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="system">Atualizações do Sistema</Label>
                    <Switch
                      id="system"
                      checked={notificationSettings.system}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("system", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotificationSettings} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Preferências"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Conta</CardTitle>
              <CardDescription>
                Gerencie suas preferências de idioma e região
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={accountSettings.language}
                    onValueChange={(value) => handleAccountChange("language", value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={accountSettings.timezone}
                    onValueChange={(value) => handleAccountChange("timezone", value)}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">
                        Brasília (GMT-3)
                      </SelectItem>
                      <SelectItem value="America/Manaus">
                        Manaus (GMT-4)
                      </SelectItem>
                      <SelectItem value="America/Rio_Branco">
                        Rio Branco (GMT-5)
                      </SelectItem>
                      <SelectItem value="America/Noronha">
                        Fernando de Noronha (GMT-2)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveAccountSettings} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Atualize sua senha e ative a autenticação de dois fatores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={securitySettings.currentPassword}
                    onChange={(e) =>
                      handleSecurityChange("currentPassword", e.target.value)
                    }
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={securitySettings.newPassword}
                    onChange={(e) =>
                      handleSecurityChange("newPassword", e.target.value)
                    }
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={securitySettings.confirmPassword}
                    onChange={(e) =>
                      handleSecurityChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="two-factor"
                    checked={securitySettings.twoFactor}
                    onCheckedChange={(checked) =>
                      handleSecurityChange("twoFactor", checked)
                    }
                  />
                  <Label htmlFor="two-factor">
                    Ativar Autenticação de Dois Fatores
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSecuritySettings} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
