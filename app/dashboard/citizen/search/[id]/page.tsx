import type React from "react"
import { Badge } from "@/components/ui/badge"

interface Tender {
  id: string
  title: string
  number: string
  agency: string
  modality: string
  openingDate: string
  impugnationDeadline: string
  clarificationDeadline: string
  estimatedValue: number
  status: string
  groups?: {
    id: string
    items: {
      id: string
      number: string
      description: string
      quantity: number
      unit: string
    }[]
  }[]
  items?: {
    id: string
    number: string
    description: string
    quantity: number
    unit: string
  }[]
}

interface Props {
  params: {
    id: string
  }
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "aberto":
      return "secondary"
    case "em andamento":
      return "secondary"
    case "concluído":
      return "success"
    case "cancelado":
      return "destructive"
    default:
      return "default"
  }
}

const TenderDetailsPage: React.FC<Props> = async ({ params }) => {
  // Mock data for demonstration purposes
  const tender: Tender = {
    id: params.id,
    title: "Contratação de empresa especializada em serviços de limpeza e conservação",
    number: "001/2024",
    agency: "Prefeitura Municipal de Exemplo",
    modality: "Pregão Eletrônico",
    openingDate: "2024-03-15T10:00:00",
    impugnationDeadline: "2024-03-08T17:00:00",
    clarificationDeadline: "2024-03-10T17:00:00",
    estimatedValue: 150000.0,
    status: "Aberto",
    groups: [
      {
        id: "group1",
        items: [
          {
            id: "item1",
            number: "1",
            description: "Serviços de limpeza geral",
            quantity: 12,
            unit: "meses",
          },
          {
            id: "item2",
            number: "2",
            description: "Serviços de conservação predial",
            quantity: 12,
            unit: "meses",
          },
        ],
      },
    ],
    items: [
      {
        id: "item3",
        number: "3",
        description: "Fornecimento de materiais de limpeza",
        quantity: 1,
        unit: "lote",
      },
    ],
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Detalhes da Licitação</h1>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">{tender.title}</h3>
              <p className="text-sm text-muted-foreground">Número: {tender.number}</p>
            </div>

            {/* Órgão em evidência (movido para o topo) */}
            <div className="grid gap-2">
              <div className="font-semibold">Órgão</div>
              <div>{tender.agency}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="font-semibold">Modalidade</div>
                <div>{tender.modality}</div>
              </div>
              <div className="grid gap-2">
                <div className="font-semibold">Data de Abertura</div>
                <div>
                  {new Date(tender.openingDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Nova seção para data limite de impugnação */}
              <div className="grid gap-2">
                <div className="font-semibold">Data Limite para Impugnação</div>
                <div>
                  {new Date(tender.impugnationDeadline).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Nova seção para data limite de esclarecimentos */}
              <div className="grid gap-2">
                <div className="font-semibold">Data Limite para Esclarecimentos</div>
                <div>
                  {new Date(tender.clarificationDeadline).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="font-semibold">Valor Estimado</div>
                <div>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tender.estimatedValue)}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="font-semibold">Status</div>
                <div>
                  <Badge variant={getStatusVariant(tender.status)}>{tender.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Grupos e Itens com nomenclatura atualizada */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Grupos e Itens</h3>
            </div>

            {tender.groups &&
              tender.groups.map((group, index) => (
                <div key={group.id} className="border rounded-md p-4 mb-4">
                  <h4 className="text-lg font-medium mb-2">Grupo {index + 1}</h4>
                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
                        <div className="grid gap-2">
                          <div className="font-semibold">Item</div>
                          <div>{item.number}</div>
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                          <div className="font-semibold">Descrição</div>
                          <div>{item.description}</div>
                        </div>
                        <div className="grid gap-2">
                          <div className="font-semibold">Quantidade</div>
                          <div>
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* Itens individuais (não agrupados) */}
            {tender.items &&
              tender.items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
                  <div className="grid gap-2">
                    <div className="font-semibold">Item</div>
                    <div>{item.number}</div>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <div className="font-semibold">Descrição</div>
                    <div>{item.description}</div>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-semibold">Quantidade</div>
                    <div>
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Resto do código permanece o mesmo */}
      </div>
    </div>
  )
}

export default TenderDetailsPage
