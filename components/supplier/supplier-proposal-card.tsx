"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar, MapPin } from "lucide-react";

interface SupplierProposalCardProps {
  proposal: any;
}

export default function SupplierProposalCard({ proposal }: SupplierProposalCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      active: { label: "Ativa", variant: "default" },
      under_analysis: { label: "Em Análise", variant: "secondary" },
      accepted: { label: "Aceita", variant: "default" },
      classified: { label: "Classificada", variant: "secondary" },
      rejected: { label: "Rejeitada", variant: "destructive" },
      disqualified: { label: "Desclassificada", variant: "destructive" },
      withdrawn: { label: "Retirada", variant: "outline" },
      winner: { label: "Vencedora", variant: "default" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTenderStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      draft: { label: "Rascunho", variant: "secondary" },
      published: { label: "Publicada", variant: "default" },
      active: { label: "Ativa", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "default" },
      completed: { label: "Concluída", variant: "outline" },
      finished: { label: "Finalizada", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "item" ? "secondary" : "outline"} className="ml-2">
        {type === "item" ? "Por Item" : "Por Lote"}
      </Badge>
    );
  };

  // NOVO: Função para formatar modalidade
  const formatModality = (modality: string) => {
    const modalityMap: Record<string, string> = {
      pregao_eletronico: "Pregão Eletrônico",
      concorrencia: "Concorrência",
      tomada_de_precos: "Tomada de Preços",
      convite: "Convite",
      leilao: "Leilão",
      concurso: "Concurso",
    };
    
    return modalityMap[modality] || modality;
  };

  // NOVO: Função para gerar número de identificação mais amigável
  const getDisplayId = (proposal: any) => {
    // Usar tender_number se disponível, senão usar os últimos 8 chars do tender_id
    if (proposal.tenders?.tender_number) {
      return `Edital ${proposal.tenders.tender_number}`;
    }
    
    const shortId = proposal.tender_id ? proposal.tender_id.slice(-8) : "N/A";
    return `Edital ${shortId}`;
  };

  // NOVO: Função para formatar info do lote
  const getLotInfo = (proposal: any) => {
    if (proposal.lot_id && proposal.tender_lots) {
      // Se temos info do lote
      return `Lote ${proposal.tender_lots.number || "N/A"}`;
    }
    
    if (proposal.type === "item" && proposal.item_id) {
      return "Proposta por Item";
    }
    
    return "Proposta por Lote";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">
            {proposal.tenders?.title || "Licitação sem título"}
          </CardTitle>
          <div className="flex flex-col gap-1">
            {getStatusBadge(proposal.status)}
            {proposal.type && getTypeBadge(proposal.type)}
          </div>
        </div>
        <CardDescription className="space-y-1">
          {/* MUDANÇA: ID mais amigável */}
          <div className="font-medium">{getDisplayId(proposal)}</div>
          {/* MUDANÇA: Info do lote mais clara */}
          <div>{getLotInfo(proposal)}</div>
          {/* MUDANÇA: Localização com ícone */}
          <div className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {proposal.tenders?.agency?.city}, {proposal.tenders?.agency?.state}
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 space-y-3 flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Valor da Proposta:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(proposal.total_value || 0)}
            </span>
          </div>
          {proposal.tenders?.estimated_value && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Estimado:</span>
              <span className="text-sm">
                {formatCurrency(proposal.tenders.estimated_value)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Enviada em:</span>
            <span className="text-sm">{formatDate(proposal.created_at || "")}</span>
          </div>
          {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Atualizada em:</span>
              <span className="text-sm">{formatDate(proposal.updated_at)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* MUDANÇA: Modalidade formatada */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Modalidade:</span>
            <span className="text-sm font-medium">
              {formatModality(proposal.tenders?.modality || "N/A")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status da Licitação:</span>
            {getTenderStatusBadge(proposal.tenders?.status || "unknown")}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Órgão:</span>
            <span className="text-sm text-right line-clamp-2">
              {proposal.tenders?.agency?.name || "N/A"}
            </span>
          </div>
        </div>

        {proposal.notes && (
          <div className="space-y-1">
            <span className="text-sm font-medium">Observações:</span>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {proposal.notes}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button variant="outline" asChild className="w-full">
          <Link href={`/dashboard/supplier/tenders/${proposal.tender_id}`}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Detalhes
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}