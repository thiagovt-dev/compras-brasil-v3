import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

export async function TenderSessionInfo({ tenderId }: { tenderId: string }) {
  const supabase = createServerSupabaseClient()

  // Buscar informações da licitação
  const { data: tender } = await supabase
    .from("tenders")
    .select(`
      id,
      title,
      number,
      status,
      opening_date,
      modality,
      dispute_mode,
      judgment_criteria,
      tender_team (
        id,
        role,
        auth.users (
          email
        )
      )
    `)
    .eq("id", tenderId)
    .single()

  // Encontrar o pregoeiro
  const auctioneer = tender?.tender_team?.find((member) => member.role === "pregoeiro")

  // Formatar status para exibição
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }
    > = {
      draft: { label: "Rascunho", variant: "outline" },
      active: { label: "Ativa", variant: "success" },
      in_progress: { label: "Em Andamento", variant: "success" },
      suspended: { label: "Suspensa", variant: "destructive" },
      completed: { label: "Concluída", variant: "secondary" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    }

    return statusMap[status] || { label: status, variant: "default" }
  }

  const statusDisplay = tender?.status
    ? getStatusDisplay(tender.status)
    : { label: "Desconhecido", variant: "outline" as const }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
        {tender?.opening_date && (
          <span className="text-sm text-muted-foreground">
            Abertura: {new Date(tender.opening_date).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Modalidade</h3>
          <p className="text-sm">{formatModality(tender?.modality)}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Modo de Disputa</h3>
          <p className="text-sm">{formatDisputeMode(tender?.dispute_mode)}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Critério de Julgamento</h3>
          <p className="text-sm">{formatJudgmentCriteria(tender?.judgment_criteria)}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Pregoeiro</h3>
          <p className="text-sm">{auctioneer?.auth?.users?.email || "Não definido"}</p>
        </div>
      </div>
    </div>
  )
}

// Funções auxiliares para formatar os valores
function formatModality(modality?: string): string {
  const modalityMap: Record<string, string> = {
    "pregao-eletronico": "Pregão Eletrônico",
    "concorrencia-eletronica": "Concorrência Eletrônica",
    "dispensa-eletronica": "Dispensa Eletrônica",
  }

  return modalityMap[modality || ""] || modality || "Não definido"
}

function formatDisputeMode(mode?: string): string {
  const modeMap: Record<string, string> = {
    aberto: "Aberto",
    fechado: "Fechado",
    "aberto-fechado": "Aberto e Fechado",
    "fechado-aberto": "Fechado e Aberto",
  }

  return modeMap[mode || ""] || mode || "Não definido"
}

function formatJudgmentCriteria(criteria?: string): string {
  const criteriaMap: Record<string, string> = {
    "menor-preco": "Menor Preço",
    "maior-desconto": "Maior Desconto",
    "melhor-tecnica": "Melhor Técnica",
    "tecnica-preco": "Técnica e Preço",
  }

  return criteriaMap[criteria || ""] || criteria || "Não definido"
}
