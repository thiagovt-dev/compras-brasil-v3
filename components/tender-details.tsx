"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenderLots } from "@/components/tender-lots";
import { TenderDocuments } from "@/components/tender-documents";
import { TenderClarifications } from "@/components/tender-clarifications";
import { TenderImpugnations } from "@/components/tender-impugnations";
import { TenderProposals } from "@/components/tender-proposals";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Users, Eye, Heart, FileText, Gavel, Tag, AlertCircle } from "lucide-react";

const TenderDetails = ({
  tender,
  showProposals,
  isAgencyUser = false,
  isAuctioneer = false,
  isAdmin = false,
  isSupplierParticipant = false,
  isCitizen = false,
  userProfile,
  usingMockData = false,
}: {
  tender: any;
  showProposals: boolean;
  isAgencyUser: boolean;
  isAuctioneer: boolean;
  isAdmin: boolean;
  isSupplierParticipant: boolean;
  isCitizen: boolean;
  userProfile: any;
  usingMockData?: boolean;
}) => {
  const router = useRouter();

  // Determinar se pode acessar a sala de disputa
  const canAccessDisputeRoom = isAuctioneer || isSupplierParticipant || isCitizen;

  // Determinar se pode participar ativamente (não apenas visualizar)
  const canParticipateInDispute = isAuctioneer || isSupplierParticipant;

  const getDisputeButtonText = () => {
    if (isAuctioneer) return "Gerenciar Sala de Disputa";
    if (isSupplierParticipant) return "Participar da Disputa";
    if (isCitizen) return "Acompanhar Disputa";
    return "Acessar Sala de Disputa";
  };

  const getDisputeButtonIcon = () => {
    if (isCitizen) return <Eye className="h-4 w-4 mr-2" />;
    return <Users className="h-4 w-4 mr-2" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      draft: { label: "Rascunho", variant: "secondary" },
      published: { label: "Publicado", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "default" },
      completed: { label: "Concluído", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-none px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Processo</h1>
                <p className="text-sm text-gray-500">
                  Pesquisa / {tender.tender_number}
                  {usingMockData && " (Demonstração)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canAccessDisputeRoom && tender.status === "published" && (
                <Button
                  asChild
                  variant={canParticipateInDispute ? "default" : "outline"}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  <a href={`/demo/dispute`} target="_blank" rel="noopener noreferrer">
                    {getDisputeButtonIcon()}
                    {getDisputeButtonText()}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-none px-6 py-6">
        {/* Indicador de dados mockados */}
        {usingMockData && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-base text-amber-800">
              <strong>Modo Demonstração:</strong> Esta licitação não foi encontrada no sistema. 
              Exibindo dados de exemplo para demonstração das funcionalidades.
            </p>
          </div>
        )}

        {/* Process Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Gavel className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {tender.agency?.name}
                {usingMockData && (
                  <Badge variant="secondary" className="ml-3">
                    Demo
                  </Badge>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Processo:</label>
                    <p className="text-base text-gray-900">{tender.tender_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pregão:</label>
                    <p className="text-base text-gray-900">{tender.tender_number}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Critério de julgamento:
                  </label>
                  <p className="text-base text-gray-900">{tender.judgment_criteria || "Menor Preço"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Método de disputa:</label>
                  <p className="text-base text-gray-900">{tender.dispute_mode || "Aberto"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Benefício de regionalidade:
                  </label>
                  <p className="text-base text-gray-900">Sem benefício</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Pregoeiro(a):</label>
                  <p className="text-base text-gray-900">
                    {usingMockData ? "João Silva Santos" : "Nome do Pregoeiro"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição do Objeto:</label>
                  <p className="text-base text-gray-900 leading-relaxed">{tender.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Segmentos:</label>
                  <p className="text-base text-gray-900">{tender.category}</p>
                </div>
              </div>

              {/* Right Column - Dates and Status */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Publicação no diário oficial:
                  </label>
                  <p className="text-base text-gray-900">{formatDate(tender.opening_date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Publicação na plataforma:
                  </label>
                  <p className="text-base text-gray-900">{formatDate(tender.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Início da disputa/fim do envio de proposta:
                  </label>
                  <p className="text-base text-gray-900">{formatDate(tender.closing_date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Limite para a impugnação:
                  </label>
                  <p className="text-base text-gray-900">
                    {formatDate(tender.impugnation_deadline)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Valor Estimado:</label>
                  <p className="text-base text-gray-900 font-semibold">
                    {tender.is_value_secret
                      ? "Sigiloso"
                      : formatCurrency(tender.estimated_value || 0)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status:</label>
                  <div className="mt-1">{getStatusBadge(tender.status)}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <Button variant="outline" className="flex items-center gap-2" disabled={usingMockData}>
                <Heart className="h-4 w-4" />
                Favoritar
              </Button>

              {canAccessDisputeRoom && tender.status === "published" && (
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <a href={`/demo/dispute`} target="_blank" rel="noopener noreferrer">
                    <Users className="h-4 w-4" />
                    Assistir disputa
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Solicitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Solicitações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <TenderClarifications tenderId={tender.id} usingMockData={usingMockData} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Right Column - Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <TenderDocuments tender={tender} usingMockData={usingMockData} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Materials/Services Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Materiais / Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TenderLots tender={tender} usingMockData={usingMockData} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Additional Tabs for other content */}
        <Card className="mt-6">
          <CardContent className="p-0">
            <Tabs defaultValue="impugnations" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="impugnations">Impugnações</TabsTrigger>
                <TabsTrigger value="notices">Avisos</TabsTrigger>
                <TabsTrigger value="proposals">Propostas</TabsTrigger>
              </TabsList>

              <TabsContent value="impugnations" className="p-6">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <TenderImpugnations tenderId={tender.id} usingMockData={usingMockData} />
                </Suspense>
              </TabsContent>

              <TabsContent value="notices" className="p-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum aviso encontrado</p>
                </div>
              </TabsContent>

              <TabsContent value="proposals" className="p-6">
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <TenderProposals
                    tenderId={tender.id}
                    lots={tender.lots || []}
                    isAgencyUser={isAgencyUser}
                    isAuctioneer={isAuctioneer}
                    usingMockData={usingMockData}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenderDetails;