import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Landmark, Search } from "lucide-react"

export default function CitizenDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Cidadão</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Aqui você pode pesquisar licitações e cadastrar fornecedores ou órgãos
          públicos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pesquisar Licitações</CardTitle>
            <CardDescription>Encontre licitações públicas em andamento ou concluídas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/search">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" />
                Pesquisar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cadastrar Fornecedor</CardTitle>
            <CardDescription>Registre uma empresa para participar de licitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/register-supplier">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Building2 className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cadastrar Órgão Público</CardTitle>
            <CardDescription>Registre um órgão público para gerenciar licitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/register-agency">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Landmark className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Licitações Recentes</h2>
        <div className="space-y-4">
          {recentTenders.map((tender) => (
            <div key={tender.id} className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-medium">{tender.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {tender.agency} • {tender.date}
                </p>
              </div>
              <Link href={`/dashboard/citizen/search/${tender.id}`}>
                <Button variant="outline" size="sm">
                  Ver detalhes
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/dashboard/citizen/search">
            <Button variant="link" className="text-primary">
              Ver todas as licitações
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Mock data for recent tenders
const recentTenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    agency: "Ministério da Educação",
    date: "Publicado em 05/06/2025",
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    agency: "Prefeitura Municipal de São Paulo",
    date: "Publicado em 04/06/2025",
  },
  {
    id: "3",
    title: "Reforma de prédio público",
    agency: "Tribunal Regional Federal",
    date: "Publicado em 03/06/2025",
  },
  {
    id: "4",
    title: "Fornecimento de material de escritório",
    agency: "Secretaria de Saúde",
    date: "Publicado em 02/06/2025",
  },
]
