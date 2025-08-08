"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SupplierDashboardClientProps {
  stats: {
    activeTenders: number;
    totalProposals: number;
    activeProposals: number;
    upcomingSessions: number;
    totalValue: number; // em centavos
    trends: {
      newProposalsThisWeek: number;
      newTendersToday: number;
    };
  };
  activities: any[];
  hasError: boolean;
  errorMessage?: string;
}

export default function SupplierDashboardClient({
  stats,
  activities,
  hasError,
  errorMessage,
}: SupplierDashboardClientProps) {
  const formatValue = (valueInCentavos: number) => {
    return formatCurrency(valueInCentavos / 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "proposal_sent":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "new_tender":
        return <Search className="h-4 w-4 text-green-600" />;
      case "upcoming_session":
        return <Calendar className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "há menos de 1 hora";
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    
    return formatDate(timestamp);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativa", variant: "default" },
      under_analysis: { label: "Em Análise", variant: "secondary" },
      classified: { label: "Classificada", variant: "secondary" },
      winner: { label: "Vencedora", variant: "default" },
      disqualified: { label: "Desclassificada", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  // if (hasError) {
  //   return (
  //     <div className="space-y-6">
  //       <div>
  //         <h1 className="text-3xl font-bold tracking-tight">Dashboard do Fornecedor</h1>
  //         <p className="text-muted-foreground">Gerencie suas licitações e propostas</p>
  //       </div>

  //       <div className="bg-red-50 border border-red-200 rounded-lg p-4">
  //         <div className="flex items-center gap-2">
  //           <AlertCircle className="h-5 w-5 text-red-600" />
  //           <p className="text-sm text-red-800">
  //             <strong>Erro ao carregar dados:</strong> {errorMessage}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Fornecedor</h1>
        <p className="text-muted-foreground">Gerencie suas licitações e propostas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[1rem] font-medium">Licitações Ativas</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTenders}</div>
            <p className="text-[1rem] text-muted-foreground">
              {stats.trends.newTendersToday > 0 && `+${stats.trends.newTendersToday} hoje`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[1rem] font-medium">Propostas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProposals}</div>
            <p className="text-[1rem] text-muted-foreground">
              {stats.trends.newProposalsThisWeek > 0 
                ? `+${stats.trends.newProposalsThisWeek} esta semana`
                : "Nenhuma esta semana"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[1rem] font-medium">Próximas Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-[1rem] text-muted-foreground">
              {stats.upcomingSessions > 0 ? "Esta semana" : "Nenhuma agendada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[1rem] font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(stats.totalValue)}</div>
            <p className="text-[1rem] text-muted-foreground">
              Em {stats.activeProposals} proposta{stats.activeProposals !== 1 ? 's' : ''} ativa{stats.activeProposals !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/supplier/tenders">
                <Search className="mr-2 h-4 w-4" />
                Buscar Licitações
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/supplier/proposals">
                <FileText className="mr-2 h-4 w-4" />
                Minhas Propostas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/supplier/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendário
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Últimas Atividades */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Atividades</CardTitle>
            <CardDescription>Acompanhe suas ações recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[1rem] font-medium leading-none">
                          {activity.title}
                        </p>
                        {activity.status && getStatusBadge(activity.status)}
                      </div>
                      <p className="text-[1rem] text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade recente encontrada
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}