"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  Trash2,
  Eye,
  FileText,
  DollarSign,
  Package
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface SupplierProposalDetailsProps {
  proposal: any; 
  lotId: string;
  tenderId: string;
  tender: any; 
}

export default function SupplierProposalDetails({
  proposal,
  lotId,
  tenderId,
  tender
}: SupplierProposalDetailsProps) {
  const { toast } = useToast();

  console.log("🎯 SupplierProposalDetails props:", {
    lotId,
    tenderId,
    hasProposal: !!proposal,
    proposal: proposal,
    tenderStatus: tender?.status,
    tenderClosingDate: tender?.closing_date
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive"; icon: any }
    > = {
      active: { label: "Ativa", variant: "default", icon: CheckCircle },
      under_analysis: { label: "Em Análise", variant: "secondary", icon: Clock },
      classified: { label: "Classificada", variant: "secondary", icon: CheckCircle },
      disqualified: { label: "Desclassificada", variant: "destructive", icon: AlertCircle },
      withdrawn: { label: "Retirada", variant: "outline", icon: AlertCircle },
      winner: { label: "Vencedora", variant: "default", icon: CheckCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canWithdrawProposal = () => {
    if (!proposal) return false;
    // Verificar se licitação ainda está aberta
    if (tender.status !== "published") return false;
    // Verificar se ainda está no prazo
    if (tender.closing_date && new Date(tender.closing_date) <= new Date()) return false;
    // Verificar status da proposta
    return ["active", "under_analysis"].includes(proposal.status);
  };

  const canEditProposal = () => {
    if (!proposal) return false;
    if (tender.status !== "published") return false;
    if (tender.closing_date && new Date(tender.closing_date) <= new Date()) return false;
    return proposal.status === "active";
  };

  const canSendProposal = () => {
    // Pode enviar se não tem proposta e licitação está aberta
    if (proposal) return false; // Já tem proposta
    if (tender.status !== "published") return false;
    if (tender.closing_date && new Date(tender.closing_date) <= new Date()) return false;
    return true;
  };
console.log("canSendProposal:", canSendProposal());
console.log("proposta:", proposal);
  if (!proposal && !canSendProposal()) {
    // Não tem proposta e não pode enviar
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              O prazo para envio de propostas foi encerrado
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Lote ID: {lotId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!proposal && canSendProposal()) {
    // Não tem proposta mas pode enviar
    return (
      <Card className="mt-4 border-dashed border-blue-300 bg-blue-50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700 mb-3">
              Você ainda não enviou uma proposta para este lote
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Lote ID: {lotId}
            </p>
            <Button asChild>
              <Link href={`/dashboard/supplier/tenders/${tenderId}/proposals`}>
                Enviar Proposta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tem proposta - mostrar detalhes
  return (
    <Card className="mt-4 border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Sua Proposta
              <span className="text-xs text-gray-400">({proposal.id?.slice(-8)})</span>
            </CardTitle>
            <CardDescription>
              Enviada em {formatDate(proposal.created_at)}
              {proposal.updated_at !== proposal.created_at && (
                <span> • Atualizada em {formatDate(proposal.updated_at)}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(proposal.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Valor da Proposta */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Valor Total da Proposta</span>
            </div>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(proposal.value || 0)}
            </span>
          </div>
        </div>

        {/* Informações do Item */}
        {proposal.tender_items && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Item da Proposta:</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Item {proposal.tender_items.item_number}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {proposal.tender_items.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantidade</p>
                  <p className="text-sm font-medium">
                    {proposal.tender_items.quantity} {proposal.tender_items.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Estimado</p>
                  <p className="text-sm font-medium">
                    {proposal.tender_items.estimated_unit_price
                      ? formatCurrency(proposal.tender_items.estimated_unit_price)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivo da Desclassificação */}
        {proposal.status === "disqualified" && proposal.disqualification_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 mb-1">Motivo da Desclassificação:</p>
                <p className="text-sm text-red-700">{proposal.disqualification_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-4 border-t">
          {canEditProposal() && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/supplier/tenders/${tenderId}/proposals`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Proposta
              </Link>
            </Button>
          )}
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/supplier/tenders/${tenderId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes da Licitação
            </Link>
          </Button>
          
          {canWithdrawProposal() && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A retirada de propostas será implementada em breve.",
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Retirar Proposta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}