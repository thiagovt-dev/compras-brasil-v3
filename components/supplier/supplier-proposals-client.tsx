"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Clock, 
  Calculator, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SupplierProposalForm } from "../tenders-supplier-proposal";


interface SupplierProposalsClientProps {
  tender: Tender;
  userProfile: any;
  userId: string;
}

export default function SupplierProposalsClient({
  tender,
  userProfile,
  userId,
}: SupplierProposalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isProposalSubmitted, setIsProposalSubmitted] = useState(false);

  // Verificar se o prazo ainda está em aberto
  const isDeadlineOpen = () => {
    if (!tender.closing_date) return true;
    return new Date(tender.closing_date) > new Date();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      published: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleProposalSuccess = () => {
    setIsProposalSubmitted(true);
    toast({
      title: "Proposta enviada com sucesso!",
      description: "Sua proposta foi registrada e está sendo analisada.",
    });
  };

  const deadlineOpen = isDeadlineOpen();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enviar Proposta</h1>
            <p className="text-lg text-gray-600">{tender.title}</p>
          </div>
        </div>

        {/* Informações básicas da licitação */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tender.agencies?.name}
              </CardTitle>
              <Badge className={getStatusColor(tender.status)}>
                {tender.status === "published" ? "Publicada" : "Em Andamento"}
              </Badge>
            </div>
            <CardDescription>
              {tender.tender_number} - {tender.tender_type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock
                      className={`h-5 w-5 ${deadlineOpen ? "text-green-600" : "text-red-600"}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Prazo para Propostas</p>
                      <p className={`text-sm ${deadlineOpen ? "text-green-600" : "text-red-600"}`}>
                        {tender.closing_date ? formatDate(tender.closing_date) : "Não definido"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Valor Estimado</p>
                      <p className="text-sm text-blue-600">
                        {tender.estimated_value
                          ? formatCurrency(tender.estimated_value)
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Abertura das Propostas</p>
                      <p className="text-sm text-orange-600">
                        {tender.opening_date ? formatDate(tender.opening_date) : "Não definido"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {!deadlineOpen && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Prazo Encerrado</p>
                <p className="text-sm text-red-700">
                  O prazo para envio de propostas foi encerrado em{" "}
                  {formatDate(tender.closing_date!)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {(() => {
          const hasExclusiveMeEppItems = tender.tender_lots?.some((lot) =>
            lot.tender_items?.some((item) => item.benefit_type === "exclusive_for_me_epp")
          );

          return (
            hasExclusiveMeEppItems && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Itens Exclusivos ME/EPP</p>
                    <p className="text-sm text-blue-700">
                      Esta licitação possui itens exclusivos para Microempresas e Empresas de
                      Pequeno Porte.
                    </p>
                  </div>
                </div>
              </div>
            )
          );
        })()}
      </div>

      {/* Formulário de Proposta */}
      {deadlineOpen && !isProposalSubmitted ? (
        <SupplierProposalForm
          tender={tender}
          lots={tender.tender_lots || []}
          supplierId={userProfile.supplier_id}
          userId={userId}
          onSuccess={handleProposalSuccess}
        />
      ) : isProposalSubmitted ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-600 mb-2">Proposta Enviada!</h3>
            <p className="text-gray-600 mb-6">
              Sua proposta foi enviada com sucesso e está sendo analisada pela equipe responsável.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                • Você receberá notificações sobre o status da análise
              </p>
              <p className="text-sm text-gray-500">
                • Acompanhe o andamento na sua área do fornecedor
              </p>
              <p className="text-sm text-gray-500">
                • Prepare-se para a fase de disputa, se aprovado
              </p>
            </div>
            <Button className="mt-6" onClick={() => router.push("/dashboard/supplier/my-tenders")}>
              Ver Minhas Participações
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-600 mb-2">Prazo Encerrado</h3>
            <p className="text-gray-600">
              O prazo para envio de propostas foi encerrado. Você não pode mais participar desta
              licitação.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}