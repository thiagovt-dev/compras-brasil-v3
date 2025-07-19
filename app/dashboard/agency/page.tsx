import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, PlusCircle, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  fetchActiveTendersByAgency, 
  fetchRecentTendersByAgency, 
  fetchAgencyStats 
} from "@/lib/actions/tenderAction";
import { requireAgencyUser } from "@/lib/actions/authAction";
import { formatCurrency } from "@/lib/utils";

function formatStatus(status: string) {
  const statusMap = {
    "published": "Publicada",
    "in_progress": "Em Andamento", 
    "completed": "Concluída",
    "cancelled": "Cancelada",
    "revoked": "Revogada",
    "failed": "Fracassada",
    "deserted": "Deserta"
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

function getBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "published":
      return "secondary";
    case "in_progress":
      return "default";
    case "completed":
      return "outline";
    case "cancelled":
    case "revoked":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function AgencyDashboard() {
  // Verificar autenticação e obter dados do usuário via server action
  const authResult = await requireAgencyUser();
  
  if (!authResult.success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso não autorizado</h2>
          <p className="text-muted-foreground">Você precisa estar vinculado a um órgão público.</p>
        </div>
      </div>
    );
  }

  const { profile, agencyId } = authResult.data ?? {};

  // Buscar dados da agência em paralelo
  const [activeTendersResult, recentTendersResult, statsResult] = await Promise.all([
    fetchActiveTendersByAgency(agencyId, 3),
    fetchRecentTendersByAgency(agencyId, 3),
    fetchAgencyStats(agencyId)
  ]);

  const activeTenders = activeTendersResult.success ? activeTendersResult.data : [];
  const recentTenders = recentTendersResult.success ? recentTendersResult.data : [];
  const stats = statsResult.success ? statsResult.data : {
    activeTenders: 0,
    completedTenders: 0,
    totalValue: 0,
    totalTenders: 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Órgão Público</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil, {profile.name}. Gerencie suas licitações e acompanhe processos em andamento.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Agenda</CardTitle>
            <CardDescription>Visualize suas licitações em um calendário</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/agency/calendar">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Agenda
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Licitações em Andamento</CardTitle>
            <CardDescription>Gerencie processos licitatórios ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/agency/active-tenders">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Clock className="mr-2 h-4 w-4" />
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Criar Nova Licitação</CardTitle>
            <CardDescription>Inicie um novo processo licitatório</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/agency/create-tender">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Licitações em Andamento</CardTitle>
              <Link href="/dashboard/agency/active-tenders">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTenders && activeTenders.length > 0 ? (
              <div className="space-y-4">
                {activeTenders.map((tender: any) => (
                  <div key={tender.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{tender.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{tender.tender_number}</p>
                        <Badge variant={getBadgeVariant(tender.status)}>
                          {formatStatus(tender.status)}
                        </Badge>
                      </div>
                      {tender.estimated_value && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(tender.estimated_value)}
                        </p>
                      )}
                    </div>
                    <Link href={`/dashboard/agency/active-tenders/${tender.id}`}>
                      <Button variant="outline" size="sm">
                        Gerenciar
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma licitação ativa no momento.</p>
                <Link href="/dashboard/agency/create-tender">
                  <Button variant="outline" size="sm" className="mt-2">
                    Criar primeira licitação
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Licitações Recentes</CardTitle>
              <Link href="/dashboard/agency/tenders">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTenders && recentTenders.length > 0 ? (
              <div className="space-y-4">
                {recentTenders.map((tender: any) => (
                  <div key={tender.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{tender.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{tender.tender_number}</p>
                        <Badge variant={getBadgeVariant(tender.status)}>
                          {formatStatus(tender.status)}
                        </Badge>
                      </div>
                      {tender.estimated_value && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(tender.estimated_value)}
                        </p>
                      )}
                    </div>
                    <Link href={`/dashboard/agency/tenders/${tender.id}`}>
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma licitação recente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Desempenho</CardTitle>
          <CardDescription>Estatísticas e métricas das licitações do seu órgão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-4xl font-bold text-blue-700">{stats?.activeTenders}</div>
              <p className="text-sm text-muted-foreground text-center">
                Licitações em Andamento
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-4xl font-bold text-green-700">{stats?.completedTenders}</div>
              <p className="text-sm text-muted-foreground text-center">Licitações Concluídas</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-4xl font-bold text-purple-700">{formatCurrency(stats?.totalValue)}</div>
              <p className="text-sm text-muted-foreground text-center">Valor Total Estimado</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Link href="/dashboard/agency/statistics">
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                Ver estatísticas detalhadas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}