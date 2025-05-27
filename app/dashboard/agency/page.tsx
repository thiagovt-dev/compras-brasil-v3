import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, PlusCircle, BarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AgencyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Órgão Público</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Gerencie suas licitações e acompanhe processos em andamento.
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
            <div className="space-y-4">
              {activeTenders.map((tender) => (
                <div key={tender.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{tender.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">{tender.number}</p>
                      <Badge variant={getBadgeVariant(tender.status)}>{tender.status}</Badge>
                    </div>
                  </div>
                  <Link href={`/dashboard/agency/active-tenders/${tender.id}`}>
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Licitações Recentes</CardTitle>
              <Link href="/dashboard/agency/completed-tenders">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenders.map((tender) => (
                <div key={tender.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{tender.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">{tender.number}</p>
                      <Badge variant={getCompletedBadgeVariant(tender.result)}>{tender.result}</Badge>
                    </div>
                  </div>
                  <Link href={`/dashboard/agency/completed-tenders/${tender.id}`}>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
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
              <div className="text-4xl font-bold text-green-700">12</div>
              <p className="text-sm text-muted-foreground text-center">Licitações em Andamento</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-4xl font-bold text-green-700">45</div>
              <p className="text-sm text-muted-foreground text-center">Licitações Concluídas</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-4xl font-bold text-green-700">R$ 1.2M</div>
              <p className="text-sm text-muted-foreground text-center">Valor Economizado</p>
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
  )
}

// Helper functions for badges
function getBadgeVariant(status: string) {
  switch (status) {
    case "Publicada":
      return "secondary"
    case "Aguardando abertura":
      return "default"
    case "Em disputa":
      return "warning"
    case "Em andamento":
      return "default"
    default:
      return "outline"
  }
}

function getCompletedBadgeVariant(result: string) {
  switch (result) {
    case "Homologada":
      return "success"
    case "Revogada":
      return "destructive"
    case "Anulada":
      return "destructive"
    case "Fracassada":
      return "warning"
    case "Deserta":
      return "secondary"
    default:
      return "outline"
  }
}

// Mock data for active tenders
const activeTenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    number: "Pregão Eletrônico nº 001/2025",
    status: "Em disputa",
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    number: "Pregão Eletrônico nº 002/2025",
    status: "Aguardando abertura",
  },
  {
    id: "3",
    title: "Fornecimento de material de escritório",
    number: "Pregão Eletrônico nº 003/2025",
    status: "Publicada",
  },
]

// Mock data for recent tenders
const recentTenders = [
  {
    id: "4",
    title: "Reforma de prédio público",
    number: "Concorrência nº 001/2025",
    result: "Homologada",
  },
  {
    id: "5",
    title: "Aquisição de veículos",
    number: "Pregão Eletrônico nº 004/2024",
    result: "Revogada",
  },
  {
    id: "6",
    title: "Serviços de consultoria",
    number: "Pregão Eletrônico nº 005/2024",
    result: "Fracassada",
  },
]
