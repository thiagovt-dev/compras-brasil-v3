import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function SupportDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Suporte</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Gerencie as solicitações de suporte dos usuários.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
            <CardDescription>Solicitações que aguardam atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-yellow-500">{pendingRequests.length}</div>
              <Link href="/dashboard/support/management?status=pending">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <Clock className="mr-2 h-4 w-4" />
                  Atender
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Em Atendimento</CardTitle>
            <CardDescription>Solicitações que estão sendo atendidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-blue-500">{inProgressRequests.length}</div>
              <Link href="/dashboard/support/management?status=in-progress">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resolvidas</CardTitle>
            <CardDescription>Solicitações que foram resolvidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-green-500">{resolvedRequests.length}</div>
              <Link href="/dashboard/support/management?status=resolved">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações Recentes</CardTitle>
          <CardDescription>Últimas solicitações de suporte recebidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">{request.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {request.user} • {request.time}
                    </p>
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                  </div>
                </div>
                <Link href={`/dashboard/support/management/${request.id}`}>
                  <Button variant="outline" size="sm">
                    Atender
                  </Button>
                </Link>
              </div>
            ))}
            {inProgressRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">{request.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {request.user} • {request.time}
                    </p>
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                  </div>
                </div>
                <Link href={`/dashboard/support/management/${request.id}`}>
                  <Button variant="outline" size="sm">
                    Continuar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/dashboard/support/management">
              <Button variant="outline" size="sm">
                Ver todas as solicitações
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho do Suporte</CardTitle>
          <CardDescription>Estatísticas de atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-3xl font-bold text-green-700">92%</div>
              <p className="text-sm text-muted-foreground text-center">Taxa de Resolução</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-3xl font-bold text-green-700">3.2h</div>
              <p className="text-sm text-muted-foreground text-center">Tempo Médio de Resposta</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
              <div className="text-3xl font-bold text-green-700">4.8/5</div>
              <p className="text-sm text-muted-foreground text-center">Satisfação do Usuário</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function for badges
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "Pendente":
      return "warning"
    case "Em atendimento":
      return "default"
    case "Resolvido":
      return "success"
    default:
      return "outline"
  }
}

// Mock data for support requests
const pendingRequests = [
  {
    id: "1",
    title: "Problema ao enviar proposta",
    user: "Empresa XYZ Ltda",
    time: "Há 1 hora",
    status: "Pendente",
  },
  {
    id: "2",
    title: "Dúvida sobre documentação",
    user: "Prefeitura de Belo Horizonte",
    time: "Há 3 horas",
    status: "Pendente",
  },
  {
    id: "3",
    title: "Erro ao acessar licitação",
    user: "Empresa ABC Comércio",
    time: "Há 5 horas",
    status: "Pendente",
  },
]

const inProgressRequests = [
  {
    id: "4",
    title: "Problema com upload de documentos",
    user: "Secretaria de Educação",
    time: "Há 2 horas",
    status: "Em atendimento",
  },
  {
    id: "5",
    title: "Dúvida sobre fase recursal",
    user: "Empresa DEF Engenharia",
    time: "Há 4 horas",
    status: "Em atendimento",
  },
]

const resolvedRequests = [
  {
    id: "6",
    title: "Problema com login",
    user: "Empresa GHI Tecnologia",
    time: "Há 1 dia",
    status: "Resolvido",
  },
  {
    id: "7",
    title: "Dúvida sobre cadastro",
    user: "Prefeitura de Fortaleza",
    time: "Há 2 dias",
    status: "Resolvido",
  },
  {
    id: "8",
    title: "Erro ao gerar relatório",
    user: "Ministério da Saúde",
    time: "Há 3 dias",
    status: "Resolvido",
  },
]
