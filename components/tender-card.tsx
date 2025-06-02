import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, FileText, Building, Tag } from "lucide-react";

interface TenderCardProps {
  tender: {
    id: string;
    title: string;
    tender_number: string;
    modality: string;
    category: string;
    agency_id: string;
    tender_type: string;
    agency?: {
      name: string;
    };
    opening_date: string;
    closing_date: string;
    status: string;
    value?: number;
    is_value_secret: boolean;
    created_at: string;
  };
  showAgency?: boolean;
}

export function TenderCard({ tender, showAgency = true }: TenderCardProps) {
  const getModalityLabel = (modality: string) => {
    const modalityMap: Record<string, string> = {
      pregao_eletronico: "Pregão Eletrônico",
      concorrencia: "Concorrência Eletrônica",
      tomada_de_precos: "Dispensa Eletrônica",
    };
    return modalityMap[modality] || modality;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "aquisicao-bens": "Aquisição de Bens",
      "servicos-comuns": "Serviços Comuns",
      "servicos-comuns-engenharia": "Serviços Comuns de Engenharia",
      "aquisicao-bens-especiais": "Aquisição de Bens Especiais",
      "servicos-especiais": "Serviços Especiais",
      obras: "Obras",
      "servicos-especiais-engenharia": "Serviços Especiais de Engenharia",
    };
    return categoryMap[category] || category;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      draft: {
        label: "Rascunho",
        variant: "outline",
      },
      published: {
        label: "Aberta",
        variant: "default",
      },
      closed: {
        label: "Encerrada",
        variant: "secondary",
      },
      canceled: {
        label: "Cancelada",
        variant: "destructive",
      },
      suspended: {
        label: "Suspensa",
        variant: "destructive",
      },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não definida";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">{tender.title}</CardTitle>
          {getStatusBadge(tender.status)}
        </div>
        <div className="text-[1rem] text-muted-foreground">
          <span className="font-medium">Nº {tender.tender_number}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center gap-2 text-[1rem]">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span>{getModalityLabel(tender.tender_type)}</span>
        </div>

        {showAgency && tender.agency && (
          <div className="flex items-center gap-2 text-[1rem]">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{tender.agency.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[1rem]">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Abertura: {formatDate(tender.opening_date)}</span>
        </div>

        <div className="flex items-center gap-2 text-[1rem]">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Propostas até: {formatDate(tender.closing_date)}</span>
        </div>

        {!tender.is_value_secret && tender.value && (
          <div className="flex items-center gap-2 text-[1rem]">
            <span className="font-medium">Valor: {formatCurrency(tender.value)}</span>
          </div>
        )}

        {tender.is_value_secret && (
          <div className="flex items-center gap-2 text-[1rem]">
            <span className="font-medium">Valor: Sigiloso</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/dashboard/tenders/${tender.id}`}
          className="text-[1rem] text-primary hover:underline flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Ver detalhes
        </Link>
      </CardFooter>
    </Card>
  );
}
