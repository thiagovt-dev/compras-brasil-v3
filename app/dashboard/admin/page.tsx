import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, Users, Activity, BarChart } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Gerencie todos os aspectos da plataforma.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Licitações em Andamento</CardTitle>
            <CardDescription>Visualize e gerencie todas as licitações ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/active-tenders">
              <Button className="w-full bg-green-700 hover:bg-green-800">
                <Clock className="mr-2 h-4 w-4" />
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Licitações Concluídas</CardTitle>
            <CardDescription>Acesse o histórico de licitações finalizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/completed-tenders">
              <Button className="w-full bg-green-700 hover:bg-green-800">
                <CheckCircle className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Gerenciar Usuários</CardTitle>
            <CardDescription>Administre todos os usuários da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/manage-users">
              <Button className="w-full bg-green-700 hover:bg-green-800">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Plataforma</CardTitle>
            <CardDescription>Visão geral do desempenho do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
                <div className="text-3xl font-bold text-green-700">1,245</div>
                <p className="text-sm text-muted-foreground text-center">Usuários Ativos</p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
                <div className="text-3xl font-bold text-green-700">328</div>
                <p className="text-sm text-muted-foreground text-center">Licitações Ativas</p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
                <div className="text-3xl font-bold text-green-700">87%</div>
                <p className="text-sm text-muted-foreground text-center">Taxa de Sucesso</p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-4">
                <div className="text-3xl font-bold text-green-700">R$ 15M</div>
                <p className="text-sm text-muted-foreground text-center">Valor Economizado</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link href="/dashboard/admin/statistics">
                <Button variant="outline">
                  <BarChart className="mr-2 h-4 w-4" />
                  Ver estatísticas detalhadas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações realizadas na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 border-b pb-4">
                  <div className="mt-0.5 rounded-full p-1 bg-green-100">
                    <Activity className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/dashboard/admin/user-activity">
                <Button variant="outline" size="sm">
                  Ver todas as atividades
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Suporte</CardTitle>
            <CardDescription>Solicitações de suporte pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supportRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{request.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {request.user} • {request.time}
                      </p>
                    </div>
                  </div>
                  <Link href={`/dashboard/admin/support-management/${request.id}`}>
                    <Button variant="outline" size="sm">
                      Atender
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/dashboard/admin/support-management">
                <Button variant="outline" size="sm">
                  Ver todas as solicitações
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Cadastro</CardTitle>
            <CardDescription>Solicitações de cadastro pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrationRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{request.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {request.type} • {request.time}
                      </p>
                    </div>
                  </div>
                  <Link href={`/dashboard/admin/registration-management/${request.id}`}>
                    <Button variant="outline" size="sm">
                      Avaliar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/dashboard/admin/registration-management">
                <Button variant="outline" size="sm">
                  Ver todas as solicitações
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Mock data for recent activities
const recentActivities = [
  {
    id: "1",
    title: "Nova licitação criada",
    description: "Pregão Eletrônico nº 001/2025 foi criado por Prefeitura de São Paulo",
    time: "Há 2 horas",
  },
  {
    id: "2",
    title: "Usuário cadastrado",
    description: "Novo fornecedor 'Empresa ABC Ltda' foi cadastrado no sistema",
    time: "Há 3 horas",
  },
  {
    id: "3",
    title: "Licitação homologada",
    description: "Pregão Eletrônico nº 045/2024 foi homologado com sucesso",
    time: "Há 5 horas",
  },
]

// Mock data for support requests
const supportRequests = [
  {
    id: "1",
    title: "Problema ao enviar proposta",
    user: "Empresa XYZ Ltda",
    time: "Há 1 hora",
  },
  {
    id: "2",
    title: "Dúvida sobre documentação",
    user: "Prefeitura de Belo Horizonte",
    time: "Há 3 horas",
  },
  {
    id: "3",
    title: "Erro ao acessar licitação",
    user: "Empresa ABC Comércio",
    time: "Há 5 horas",
  },
]

// Mock data for registration requests
const registrationRequests = [
  {
    id: "1",
    title: "Empresa XYZ Tecnologia Ltda",
    type: "Fornecedor",
    time: "Há 2 horas",
  },
  {
    id: "2",
    title: "Prefeitura Municipal de Recife",
    type: "Órgão Público",
    time: "Há 4 horas",
  },
  {
    id: "3",
    title: "ABC Serviços de Limpeza",
    type: "Fornecedor",
    time: "Há 1 dia",
  },
]
