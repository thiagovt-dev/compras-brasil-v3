"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  Calendar,
  BarChart3,
} from "lucide-react";

export default function BrasilDashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({
    syncHistory: [],
    tenderStats: {
      total: 0,
      imported: 0,
      exported: 0,
      byStatus: [],
      byCategory: [],
      byModality: [],
    },
    documentStats: {
      total: 0,
      imported: 0,
      byType: [],
    },
    syncStats: {
      total: 0,
      success: 0,
      failed: 0,
      byType: [],
      byMonth: [],
    },
  });

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Em um ambiente real, faria uma chamada à API para buscar os dados do dashboard
      // Aqui estamos simulando os dados

      // Simula o tempo de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dados simulados para o dashboard
      const mockData = {
        syncHistory: [
          {
            id: "1",
            type: "import",
            items_processed: 15,
            success: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "2",
            type: "export",
            items_processed: 5,
            success: true,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "3",
            type: "document_sync",
            items_processed: 10,
            success: true,
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "4",
            type: "import",
            items_processed: 0,
            success: false,
            details: { error: "Falha na conexão com a API" },
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
        ],
        tenderStats: {
          total: 120,
          imported: 85,
          exported: 35,
          byStatus: [
            { name: "Ativo", value: 45 },
            { name: "Encerrado", value: 30 },
            { name: "Cancelado", value: 5 },
            { name: "Suspenso", value: 10 },
            { name: "Rascunho", value: 30 },
          ],
          byCategory: [
            { name: "Bens", value: 50 },
            { name: "Serviços", value: 40 },
            { name: "Obras", value: 30 },
          ],
          byModality: [
            { name: "Pregão Eletrônico", value: 60 },
            { name: "Concorrência", value: 25 },
            { name: "Dispensa", value: 20 },
            { name: "Outros", value: 15 },
          ],
        },
        documentStats: {
          total: 350,
          imported: 250,
          byType: [
            { name: "Edital", value: 120 },
            { name: "Anexo", value: 150 },
            { name: "Ata", value: 50 },
            { name: "Outros", value: 30 },
          ],
        },
        syncStats: {
          total: 45,
          success: 40,
          failed: 5,
          byType: [
            { name: "Importação", value: 25 },
            { name: "Exportação", value: 10 },
            { name: "Documentos", value: 10 },
          ],
          byMonth: [
            { name: "Jan", import: 5, export: 2, documents: 3 },
            { name: "Fev", import: 7, export: 3, documents: 4 },
            { name: "Mar", import: 10, export: 5, documents: 6 },
            { name: "Abr", import: 8, export: 4, documents: 5 },
            { name: "Mai", import: 12, export: 6, documents: 8 },
            { name: "Jun", import: 15, export: 7, documents: 10 },
          ],
        },
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Integração</h1>
          <p className="text-muted-foreground">
            Visualize métricas e estatísticas da integração com o +Brasil
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1">
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Atualizar Dados</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[1rem] font-medium">Total de Licitações</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.tenderStats.total}</div>
                <p className="text-[1rem] text-muted-foreground">
                  {dashboardData.tenderStats.imported} importadas,{" "}
                  {dashboardData.tenderStats.exported} exportadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[1rem] font-medium">Total de Documentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.documentStats.total}</div>
                <p className="text-[1rem] text-muted-foreground">
                  {dashboardData.documentStats.imported} importados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[1rem] font-medium">Sincronizações</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.syncStats.total}</div>
                <p className="text-[1rem] text-muted-foreground">
                  {dashboardData.syncStats.success} com sucesso, {dashboardData.syncStats.failed}{" "}
                  falhas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[1rem] font-medium">Última Sincronização</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.syncHistory.length > 0
                    ? formatDate(dashboardData.syncHistory[0].created_at).split(" ")[0]
                    : "N/A"}
                </div>
                <p className="text-[1rem] text-muted-foreground">
                  {dashboardData.syncHistory.length > 0
                    ? `${formatDate(dashboardData.syncHistory[0].created_at).split(" ")[1]}`
                    : "Nenhuma sincronização"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de Sincronizações por Mês */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Sincronizações por Mês</CardTitle>
                <CardDescription>Volume de dados sincronizados nos últimos meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.syncStats.byMonth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="import" name="Importações" fill="#0088FE" />
                    <Bar dataKey="export" name="Exportações" fill="#00C49F" />
                    <Bar dataKey="documents" name="Documentos" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Licitações por Status */}
            <Card>
              <CardHeader>
                <CardTitle>Licitações por Status</CardTitle>
                <CardDescription>Distribuição de licitações por status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.tenderStats.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {dashboardData.tenderStats.byStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Licitações por Modalidade */}
            <Card>
              <CardHeader>
                <CardTitle>Licitações por Modalidade</CardTitle>
                <CardDescription>Distribuição de licitações por modalidade</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.tenderStats.byModality}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {dashboardData.tenderStats.byModality.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Últimas Sincronizações */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Sincronizações</CardTitle>
              <CardDescription>Histórico recente de sincronizações com o +Brasil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.syncHistory.map((sync: any) => (
                  <div key={sync.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div
                      className={`rounded-full p-2 ${
                        sync.success ? "bg-green-100" : "bg-red-100"
                      }`}>
                      {sync.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-medium">
                          {sync.type === "import"
                            ? "Importação de Licitações"
                            : sync.type === "export"
                            ? "Exportação de Licitações"
                            : "Sincronização de Documentos"}
                        </h3>
                        <div className="mt-1 sm:mt-0">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(sync.created_at)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-col gap-1 text-[1rem] text-muted-foreground sm:flex-row sm:items-center">
                        <span>
                          {sync.success
                            ? `${sync.items_processed} itens processados`
                            : "Falha na sincronização"}
                        </span>
                        {sync.details && (
                          <>
                            <div className="hidden sm:block">•</div>
                            <span className="text-red-500">
                              {typeof sync.details === "string"
                                ? sync.details
                                : sync.details.error || "Erro"}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
