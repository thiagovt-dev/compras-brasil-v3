"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Globe,
  Link2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react"

export default function BrasilIntegrationPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("status")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncAction, setSyncAction] = useState("")

  // Integration settings
  const [settings, setSettings] = useState({
    apiKey: "",
    enabled: false,
    autoSync: true,
    syncInterval: "daily",
    importTenders: true,
    exportTenders: false,
    importDocuments: true,
    notifyChanges: true,
  })

  // Sync history
  const [syncHistory, setSyncHistory] = useState([])

  // Fetch integration config and sync history
  useEffect(() => {
    fetchIntegrationData()
  }, [])

  const fetchIntegrationData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/integrations/brasil")

      if (!response.ok) {
        throw new Error("Falha ao carregar dados da integração")
      }

      const data = await response.json()

      // Update settings
      setSettings({
        apiKey: data.config.api_key || "",
        enabled: data.config.enabled || false,
        autoSync: data.config.auto_sync || true,
        syncInterval: data.config.sync_interval || "daily",
        importTenders: data.config.import_tenders || true,
        exportTenders: data.config.export_tenders || false,
        importDocuments: data.config.import_documents || true,
        notifyChanges: data.config.notify_changes || true,
      })

      // Update connection status
      setIsConnected(data.config.enabled || false)

      // Update sync history
      setSyncHistory(data.syncHistory || [])
    } catch (error) {
      console.error("Erro ao carregar dados da integração:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da integração.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!settings.apiKey) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave de API válida.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Test connection
      const testResponse = await fetch("/api/integrations/brasil/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: settings.apiKey }),
      })

      const testResult = await testResponse.json()

      if (!testResult.success) {
        throw new Error(testResult.message || "Falha na conexão")
      }

      // Save settings
      const saveResponse = await fetch("/api/integrations/brasil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            api_key: settings.apiKey,
            enabled: true,
            auto_sync: settings.autoSync,
            sync_interval: settings.syncInterval,
            import_tenders: settings.importTenders,
            export_tenders: settings.exportTenders,
            import_documents: settings.importDocuments,
            notify_changes: settings.notifyChanges,
          },
        }),
      })

      if (!saveResponse.ok) {
        throw new Error("Falha ao salvar configurações")
      }

      setIsConnected(true)
      setSettings((prev) => ({ ...prev, enabled: true }))

      toast({
        title: "Conectado com sucesso",
        description: "A integração com +Brasil foi estabelecida com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao conectar com +Brasil:", error)
      toast({
        title: "Erro de conexão",
        description: error.message || "Não foi possível conectar com a API do +Brasil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)

    try {
      // Save settings with enabled = false
      const response = await fetch("/api/integrations/brasil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            api_key: settings.apiKey,
            enabled: false,
            auto_sync: settings.autoSync,
            sync_interval: settings.syncInterval,
            import_tenders: settings.importTenders,
            export_tenders: settings.exportTenders,
            import_documents: settings.importDocuments,
            notify_changes: settings.notifyChanges,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao desconectar")
      }

      setIsConnected(false)
      setSettings((prev) => ({ ...prev, enabled: false }))

      toast({
        title: "Desconectado",
        description: "A integração com +Brasil foi desconectada.",
      })
    } catch (error: any) {
      console.error("Erro ao desconectar de +Brasil:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível desconectar da API do +Brasil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (action: string) => {
    if (!isConnected) {
      toast({
        title: "Erro",
        description: "É necessário estar conectado para sincronizar dados.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    setSyncAction(action)

    try {
      const response = await fetch("/api/integrations/brasil/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          options: {
            limit: 50,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Falha na sincronização")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Falha na sincronização")
      }

      toast({
        title: "Sincronização concluída",
        description: result.message || "Os dados foram sincronizados com sucesso.",
      })

      // Refresh sync history
      fetchIntegrationData()
    } catch (error: any) {
      console.error("Erro ao sincronizar dados com +Brasil:", error)
      toast({
        title: "Erro de sincronização",
        description: error.message || "Não foi possível sincronizar dados com o +Brasil.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
      setSyncAction("")
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveSettings = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/integrations/brasil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            api_key: settings.apiKey,
            enabled: isConnected,
            auto_sync: settings.autoSync,
            sync_interval: settings.syncInterval,
            import_tenders: settings.importTenders,
            export_tenders: settings.exportTenders,
            import_documents: settings.importDocuments,
            notify_changes: settings.notifyChanges,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar configurações")
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações da integração foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get sync type label
  const getSyncTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      import: "Importação",
      export: "Exportação",
      document_sync: "Sincronização de Documentos",
    }
    return typeMap[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integração +Brasil</h1>
          <p className="text-muted-foreground">
            Gerencie a integração com a plataforma +Brasil para importar e exportar dados
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Badge variant={isConnected ? "success" : "destructive"} className="flex items-center gap-1 px-3 py-1">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Conectado</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Desconectado</span>
              </>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync("import")}
            disabled={!isConnected || isSyncing}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {isLoading && !isSyncing ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status da Integração</CardTitle>
                <CardDescription>Verifique o status atual da integração com a plataforma +Brasil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className={`rounded-full p-3 ${isConnected ? "bg-green-100" : "bg-red-100"}`}>
                      <Globe className={`h-8 w-8 ${isConnected ? "text-green-600" : "text-red-600"}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{isConnected ? "Integração Ativa" : "Integração Inativa"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isConnected
                          ? "Sua conexão com a plataforma +Brasil está ativa e funcionando corretamente."
                          : "Sua conexão com a plataforma +Brasil não está ativa no momento."}
                      </p>
                    </div>
                    <Button
                      onClick={isConnected ? handleDisconnect : handleConnect}
                      disabled={isLoading}
                      variant={isConnected ? "outline" : "default"}
                      className="mt-2"
                    >
                      {isLoading
                        ? isConnected
                          ? "Desconectando..."
                          : "Conectando..."
                        : isConnected
                          ? "Desconectar"
                          : "Conectar"}
                    </Button>
                  </div>
                </div>

                {!isConnected && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configurar Conexão</h3>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Chave de API</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => handleSettingChange("apiKey", e.target.value)}
                        placeholder="Digite sua chave de API do +Brasil"
                      />
                      <p className="text-xs text-muted-foreground">
                        Você pode obter sua chave de API no portal do +Brasil na seção de integrações.
                      </p>
                    </div>
                  </div>
                )}

                {isConnected && syncHistory.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações da Conexão</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-md border p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Última Sincronização</h4>
                            <p className="text-sm text-muted-foreground">
                              {syncHistory[0] ? formatDate(syncHistory[0].created_at) : "Nunca"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Itens Sincronizados</h4>
                            <p className="text-sm text-muted-foreground">
                              {syncHistory[0] ? `${syncHistory[0].items_processed} itens` : "0 itens"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="flex items-center gap-2">
                          <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Próxima Importação</h4>
                            <p className="text-sm text-muted-foreground">
                              {settings.autoSync
                                ? settings.syncInterval === "daily"
                                  ? "Amanhã"
                                  : settings.syncInterval === "hourly"
                                    ? "Na próxima hora"
                                    : "Na próxima semana"
                                : "Sincronização automática desativada"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Status da API</h4>
                            <p className="text-sm text-green-600">Operacional</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Realize ações comuns relacionadas à integração com o +Brasil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center gap-2 p-4"
                      onClick={() => handleSync("import")}
                      disabled={isSyncing}
                    >
                      {isSyncing && syncAction === "import" ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="h-6 w-6" />
                      )}
                      <div className="text-center">
                        <h4 className="text-sm font-medium">Importar Licitações</h4>
                        <p className="text-xs text-muted-foreground">Importar licitaç��es do +Brasil</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center gap-2 p-4"
                      onClick={() => handleSync("export")}
                      disabled={isSyncing}
                    >
                      {isSyncing && syncAction === "export" ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowUpFromLine className="h-6 w-6" />
                      )}
                      <div className="text-center">
                        <h4 className="text-sm font-medium">Exportar Licitações</h4>
                        <p className="text-xs text-muted-foreground">Exportar licitações para o +Brasil</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center gap-2 p-4"
                      onClick={() => handleSync("documents")}
                      disabled={isSyncing}
                    >
                      {isSyncing && syncAction === "documents" ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                      <div className="text-center">
                        <h4 className="text-sm font-medium">Sincronizar Documentos</h4>
                        <p className="text-xs text-muted-foreground">Atualizar documentos com o +Brasil</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sincronização</CardTitle>
                <CardDescription>Visualize o histórico de sincronizações com a plataforma +Brasil</CardDescription>
              </CardHeader>
              <CardContent>
                {syncHistory.length > 0 ? (
                  <div className="space-y-4">
                    {syncHistory.map((sync: any) => (
                      <div key={sync.id} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className={`rounded-full p-2 ${sync.success ? "bg-green-100" : "bg-red-100"}`}>
                          {sync.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-medium">{getSyncTypeLabel(sync.type)}</h3>
                            <div className="mt-1 sm:mt-0">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(sync.created_at)}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                            <span>
                              {sync.success ? `${sync.items_processed} itens processados` : "Falha na sincronização"}
                            </span>
                            {sync.details && (
                              <>
                                <div className="hidden sm:block">•</div>
                                <span className="text-red-500">
                                  {typeof sync.details === "string" ? sync.details : "Erro durante a sincronização"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Nenhum histórico disponível</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Não há registros de sincronização com a plataforma +Brasil.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Integração</CardTitle>
                <CardDescription>Personalize as configurações da integração com a plataforma +Brasil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Conexão</h3>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave de API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => handleSettingChange("apiKey", e.target.value)}
                      placeholder="Digite sua chave de API do +Brasil"
                    />
                    <p className="text-xs text-muted-foreground">
                      Você pode obter sua chave de API no portal do +Brasil na seção de integrações.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Sincronização</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="autoSync" className="flex flex-col space-y-1">
                        <span>Sincronização Automática</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Sincronizar automaticamente dados com o +Brasil
                        </span>
                      </Label>
                      <Switch
                        id="autoSync"
                        checked={settings.autoSync}
                        onCheckedChange={(checked) => handleSettingChange("autoSync", checked)}
                      />
                    </div>

                    {settings.autoSync && (
                      <div className="space-y-2">
                        <Label htmlFor="syncInterval">Intervalo de Sincronização</Label>
                        <select
                          id="syncInterval"
                          value={settings.syncInterval}
                          onChange={(e) => handleSettingChange("syncInterval", e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="hourly">A cada hora</option>
                          <option value="daily">Diariamente</option>
                          <option value="weekly">Semanalmente</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Dados</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="importTenders" className="flex flex-col space-y-1">
                        <span>Importar Licitações</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Importar licitações do +Brasil para o sistema
                        </span>
                      </Label>
                      <Switch
                        id="importTenders"
                        checked={settings.importTenders}
                        onCheckedChange={(checked) => handleSettingChange("importTenders", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="exportTenders" className="flex flex-col space-y-1">
                        <span>Exportar Licitações</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Exportar licitações do sistema para o +Brasil
                        </span>
                      </Label>
                      <Switch
                        id="exportTenders"
                        checked={settings.exportTenders}
                        onCheckedChange={(checked) => handleSettingChange("exportTenders", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="importDocuments" className="flex flex-col space-y-1">
                        <span>Importar Documentos</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Importar documentos do +Brasil para o sistema
                        </span>
                      </Label>
                      <Switch
                        id="importDocuments"
                        checked={settings.importDocuments}
                        onCheckedChange={(checked) => handleSettingChange("importDocuments", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Notificação</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="notifyChanges" className="flex flex-col space-y-1">
                        <span>Notificar Alterações</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receber notificações sobre alterações em licitações do +Brasil
                        </span>
                      </Label>
                      <Switch
                        id="notifyChanges"
                        checked={settings.notifyChanges}
                        onCheckedChange={(checked) => handleSettingChange("notifyChanges", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={saveSettings} disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
