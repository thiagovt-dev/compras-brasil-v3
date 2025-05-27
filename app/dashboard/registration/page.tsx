import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, X, Building2, Landmark } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function RegistrationDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Cadastro</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Gerencie as solicitações de cadastro dos usuários.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
            <CardDescription>Solicitações que aguardam avaliação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-yellow-500">{pendingRequests.length}</div>
              <Link href="/dashboard/registration/management?status=pending">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <Clock className="mr-2 h-4 w-4" />
                  Avaliar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Aprovadas</CardTitle>
            <CardDescription>Solicitações que foram aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-green-500">{approvedRequests.length}</div>
              <Link href="/dashboard/registration/management?status=approved">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Reprovadas</CardTitle>
            <CardDescription>Solicitações que foram reprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-4xl font-bold text-red-500">{rejectedRequests.length}</div>
              <Link href="/dashboard/registration/management?status=rejected">
                <Button className="w-full bg-green-700 hover:bg-green-800">
                  <X className="mr-2 h-4 w-4" />
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
          <CardDescription>Últimas solicitações de cadastro recebidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-start gap-4">
                  {request.type === "Fornecedor" ? (
                    <Building2 className="mt-1 h-5 w-5 text-gray-500" />
                  ) : (
                    <Landmark className="mt-1 h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-medium">{request.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {request.type} • {request.time}
                      </p>
                      <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/registration/management/${request.id}`}>
                  <Button variant="outline" size="sm">
                    Avaliar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/dashboard/registration/management">
              <Button variant="outline" size="sm">
                Ver todas as solicitações
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores por Segmento</CardTitle>
            <CardDescription>Distribuição de fornecedores cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierSegments.map((segment) => (
                <div key={segment.name} className="flex items-center justify-between">
                  <span className="font-medium">{segment.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{segment.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órgãos Públicos por Região</CardTitle>
            <CardDescription>Distribuição de órgãos públicos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agencyRegions.map((region) => (
                <div key={region.name} className="flex items-center justify-between">
                  <span className="font-medium">{region.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${region.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{region.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function for badges
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "Pendente":
      return "warning"
    case "Aprovado":
      return "success"
    case "Reprovado":
      return "destructive"
    default:
      return "outline"
  }
}

// Mock data for registration requests
const pendingRequests = [
  {
    id: "1",
    name: "Empresa XYZ Tecnologia Ltda",
    type: "Fornecedor",
    time: "Há 2 horas",
    status: "Pendente",
  },
  {
    id: "2",
    name: "Prefeitura Municipal de Recife",
    type: "Órgão Público",
    time: "Há 4 horas",
    status: "Pendente",
  },
  {
    id: "3",
    name: "ABC Serviços de Limpeza",
    type: "Fornecedor",
    time: "Há 1 dia",
    status: "Pendente",
  },
]

const approvedRequests = [
  {
    id: "4",
    name: "DEF Engenharia Ltda",
    type: "Fornecedor",
    time: "Há 3 dias",
    status: "Aprovado",
  },
  {
    id: "5",
    name: "Secretaria de Educação do Estado",
    type: "Órgão Público",
    time: "Há 5 dias",
    status: "Aprovado",
  },
]

const rejectedRequests = [
  {
    id: "6",
    name: "GHI Comércio de Alimentos",
    type: "Fornecedor",
    time: "Há 2 dias",
    status: "Reprovado",
  },
]

// Mock data for supplier segments
const supplierSegments = [
  { name: "Tecnologia", percentage: 35 },
  { name: "Construção Civil", percentage: 25 },
  { name: "Serviços", percentage: 20 },
  { name: "Comércio", percentage: 15 },
  { name: "Outros", percentage: 5 },
]

// Mock data for agency regions
const agencyRegions = [
  { name: "Sudeste", percentage: 40 },
  { name: "Nordeste", percentage: 25 },
  { name: "Sul", percentage: 15 },
  { name: "Centro-Oeste", percentage: 12 },
  { name: "Norte", percentage: 8 },
]
