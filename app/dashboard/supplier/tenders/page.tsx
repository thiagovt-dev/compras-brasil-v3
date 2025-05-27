import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"

export default function SupplierTendersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar Licitações</h1>
        <p className="text-muted-foreground">Encontre novas oportunidades de licitações para participar</p>
      </div>

      <div className="flex gap-4">
        <Button>
          <Search className="mr-2 h-4 w-4" />
          Pesquisar
        </Button>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="grid gap-6">
        {mockTenders.map((tender) => (
          <Card key={tender.id}>
            <CardHeader>
              <CardTitle>{tender.title}</CardTitle>
              <CardDescription>{tender.agency}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Valor:</strong> {tender.value}
                </p>
                <p>
                  <strong>Prazo:</strong> {tender.deadline}
                </p>
                <p>
                  <strong>Modalidade:</strong> {tender.modality}
                </p>
              </div>
              <div className="mt-4">
                <Button>Ver Detalhes</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const mockTenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    agency: "Ministério da Educação",
    value: "R$ 150.000,00",
    deadline: "15/01/2024",
    modality: "Pregão Eletrônico",
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    agency: "Prefeitura Municipal",
    value: "R$ 80.000,00",
    deadline: "20/01/2024",
    modality: "Concorrência",
  },
]
