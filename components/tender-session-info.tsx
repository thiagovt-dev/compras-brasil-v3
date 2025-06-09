"use client";

import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface TenderTeamMember {
  id: string;
  role: string;
  user_id: string;
  email: string | null;
}

interface TenderInfo {
  id: string;
  title: string;
  tender_number: string;
  status: string;
  opening_date: string;
  tender_type: string;
  dispute_mode: string;
  judgment_criteria: string;
  tender_team?: TenderTeamMember[];
}

export function TenderSessionInfo({ tenderId }: { tenderId: string }) {
  const [tender, setTender] = useState<TenderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchTenderData = async () => {
      try {
        setLoading(true);

        const { data: tenderData, error: tenderError } = await supabase
          .from("tenders")
          .select(
            `
            id,
            title,
            tender_number,
            status,
            opening_date,
            tender_type,
            dispute_mode,
            judgment_criteria
          `
          )
          .eq("id", tenderId)
          .single();

        if (tenderError) throw tenderError;

        const { data: teamData, error: teamError } = await supabase
          .from("tender_team_view")
          .select("id, role, user_id, email")
          .eq("tender_id", tenderId);

        if (teamError) throw teamError;

        setTender({ ...tenderData, tender_team: teamData || [] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar informações da licitação");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, [tenderId, supabase]);

  const auctioneer = tender?.tender_team?.find((member) => member.role === "pregoeiro");

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "outline" as const },
      active: { label: "Ativa", variant: "success" as const },
      in_progress: { label: "Em Andamento", variant: "success" as const },
      suspended: { label: "Suspensa", variant: "destructive" as const },
      completed: { label: "Concluída", variant: "secondary" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    return (
      statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const }
    );
  };

  const statusDisplay = tender?.status
    ? getStatusDisplay(tender.status)
    : { label: "Desconhecido", variant: "outline" as const };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Badge variant="secondary">Carregando...</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <h3 className="text-[1rem] font-medium mb-1">Carregando...</h3>
              <p className="text-[1rem] text-muted-foreground">...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Badge variant="destructive">Erro</Badge>
        </div>
        <p className="text-[1rem] text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline">{statusDisplay.label}</Badge>
        {tender?.opening_date && (
          <span className="text-[1rem] text-muted-foreground">
            Abertura: {new Date(tender.opening_date).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-[1rem] font-medium mb-1">Modalidade</h3>
          <p className="text-[1rem]">{formatModality(tender?.tender_type)}</p>
        </div>

        <div>
          <h3 className="text-[1rem] font-medium mb-1">Modo de Disputa</h3>
          <p className="text-[1rem]">{formatDisputeMode(tender?.dispute_mode)}</p>
        </div>

        <div>
          <h3 className="text-[1rem] font-medium mb-1">Critério de Julgamento</h3>
          <p className="text-[1rem]">{formatJudgmentCriteria(tender?.judgment_criteria)}</p>
        </div>

        <div>
          <h3 className="text-[1rem] font-medium mb-1">Pregoeiro</h3>
          <p className="text-[1rem]">{auctioneer?.email || "Não definido"}</p>
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares
function formatModality(modality?: string): string {
  const modalityMap: Record<string, string> = {
    "pregao-eletronico": "Pregão Eletrônico",
    "concorrencia-eletronica": "Concorrência Eletrônica",
    "dispensa-eletronica": "Dispensa Eletrônica",
  };

  return modalityMap[modality || ""] || modality || "Não definido";
}

function formatDisputeMode(mode?: string): string {
  const modeMap: Record<string, string> = {
    aberto: "Aberto",
    fechado: "Fechado",
    "aberto-fechado": "Aberto e Fechado",
    "fechado-aberto": "Fechado e Aberto",
  };

  return modeMap[mode || ""] || mode || "Não definido";
}

function formatJudgmentCriteria(criteria?: string): string {
  const criteriaMap: Record<string, string> = {
    "menor-preco": "Menor Preço",
    "maior-desconto": "Maior Desconto",
    "melhor-tecnica": "Melhor Técnica",
    "tecnica-preco": "Técnica e Preço",
  };

  return criteriaMap[criteria || ""] || criteria || "Não definido";
}
