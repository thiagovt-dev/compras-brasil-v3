"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, Key } from "lucide-react";

export default function BrasilConfigPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState({
    apiKey: "",
    enabled: false,
    autoSync: true,
    syncInterval: "daily",
    importTenders: true,
    exportTenders: false,
    importDocuments: true,
    notifyChanges: true,
  });

  // Fetch config
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      // Em um ambiente real, faria uma chamada à API para buscar a configuração
      // Aqui estamos simulando os dados

      // Simula o tempo de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dados simulados para a configuração
      const mockConfig = {
        apiKey: "sk_test_***********************",
        enabled: true,
        autoSync: true,
        syncInterval: "daily",
        importTenders: true,
        exportTenders: false,
        importDocuments: true,
        notifyChanges: true,
      };

      setConfig(mockConfig);
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração da integração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Em um ambiente real, faria uma chamada à API para salvar a configuração
      // Aqui estamos apenas simulando o salvamento

      // Simula o tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Sucesso",
        description: "Configuração da integração salva com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração da integração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      // Em um ambiente real, faria uma chamada à API para testar a conexão
      // Aqui estamos apenas simulando o teste

      // Simula o tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Sucesso",
        description: "Conexão com a API do +Brasil estabelecida com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível estabelecer conexão com a API do +Brasil.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuração da Integração</h1>
        <p className="text-muted-foreground">Configure a integração com a plataforma +Brasil</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configurações da API</CardTitle>
            <CardDescription>Configure as credenciais e opções da API do +Brasil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave de API</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Insira sua chave de API do +Brasil"
                  />
                  <Key className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Testar Conexão</span>
                </Button>
              </div>
              <p className="text-[1rem] text-muted-foreground">
                A chave de API é necessária para autenticar as requisições à API do +Brasil.
              </p>
            </div>

            {/* Status da Integração */}
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Status da Integração</Label>
                <p className="text-[1rem] text-muted-foreground">
                  Ativar ou desativar a integração com o +Brasil
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            {/* Sincronização Automática */}
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="space-y-0.5">
                <Label htmlFor="autoSync">Sincronização Automática</Label>
                <p className="text-[1rem] text-muted-foreground">
                  Sincronizar automaticamente dados com o +Brasil no intervalo configurado
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={config.autoSync}
                onCheckedChange={(checked) => setConfig({ ...config, autoSync: checked })}
              />
            </div>

            {/* Intervalo de Sincronização */}
            <div className="space-y-2">
              <Label htmlFor="syncInterval">Intervalo de Sincronização</Label>
              <Select
                value={config.syncInterval}
                onValueChange={(value) => setConfig({ ...config, syncInterval: value })}
                disabled={!config.autoSync}>
                <SelectTrigger id="syncInterval">
                  <SelectValue placeholder="Selecione um intervalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[1rem] text-muted-foreground">
                Define com que frequência os dados serão sincronizados automaticamente.
              </p>
            </div>

            {/* Opções de Sincronização */}
            <div className="space-y-4">
              <h3 className="text-[1rem] font-medium">Opções de Sincronização</h3>

              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="importTenders">Importar Licitações</Label>
                  <p className="text-[1rem] text-muted-foreground">
                    Importar licitações do +Brasil para o sistema
                  </p>
                </div>
                <Switch
                  id="importTenders"
                  checked={config.importTenders}
                  onCheckedChange={(checked) => setConfig({ ...config, importTenders: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="exportTenders">Exportar Licitações</Label>
                  <p className="text-[1rem] text-muted-foreground">
                    Exportar licitações do sistema para o +Brasil
                  </p>
                </div>
                <Switch
                  id="exportTenders"
                  checked={config.exportTenders}
                  onCheckedChange={(checked) => setConfig({ ...config, exportTenders: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="importDocuments">Importar Documentos</Label>
                  <p className="text-[1rem] text-muted-foreground">
                    Importar documentos do +Brasil para o sistema
                  </p>
                </div>
                <Switch
                  id="importDocuments"
                  checked={config.importDocuments}
                  onCheckedChange={(checked) => setConfig({ ...config, importDocuments: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyChanges">Notificar Alterações</Label>
                  <p className="text-[1rem] text-muted-foreground">
                    Gerar notificações quando houver alterações em licitações sincronizadas
                  </p>
                </div>
                <Switch
                  id="notifyChanges"
                  checked={config.notifyChanges}
                  onCheckedChange={(checked) => setConfig({ ...config, notifyChanges: checked })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
