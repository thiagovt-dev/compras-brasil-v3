"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  FileText,
  Scale,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Info,
  Package,
  User,
  Gavel,
} from "lucide-react";
import { format, addBusinessDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import {
  useTenderWorkflow,
  ResourceData,
  ResourcePhase,
} from "@/lib/contexts/tender-workflow-context";
import ResourceManagement from "@/components/resource-management";
import AuthorityDecisionsControls from "@/components/authority-decisions-controls";
import { DisputeChat } from "@/components/dispute-chat";

export default function ResourcePhasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenderId = params.id;
  const lotId = searchParams.get("lot") || "lot-001";

  // Use o contexto de workflow
  const {
    resourcePhase: currentPhase,
    setResourcePhase: setCurrentPhase,
    manifestationDeadline,
    setManifestationDeadline,
    resourceDeadline,
    setResourceDeadline,
    counterArgumentDeadline,
    setCounterArgumentDeadline,
    resources,
    systemMessages,
    chatMessages,
    addChatMessage,
    lots,
    suppliers,
    isChatEnabled,
  } = useTenderWorkflow();

  // Definimos o lote atual com base no ID
  const currentLot = lots.find((lot) => lot.id === lotId) || lots[0];

  // Encontramos o fornecedor vencedor para este lote
  const winnerSupplier = suppliers.find((s) => s.lotId === lotId && s.status === "winner");

  // Mockado para manter o formato dos dados original
  const tenderData = {
    id: "tender-001",
    number: "001/2024",
    title: "Pregão Eletrônico - Material de Escritório",
    agency: "Prefeitura Municipal de São Paulo",
  };

  // Convertemos o lote do contexto para o formato esperado pela UI
  const lotData = {
    id: currentLot.id,
    number: currentLot.number,
    name: currentLot.name,
    description: currentLot.description,
    estimatedValue: currentLot.estimatedValue,
    winner: winnerSupplier
      ? {
          id: winnerSupplier.id,
          name: winnerSupplier.name,
          company: winnerSupplier.company,
          value: winnerSupplier.value,
        }
      : {
          id: "no-winner",
          name: "Nenhum vencedor declarado",
          company: "",
          value: 0,
        },
  };

  const { toast } = useToast();

  // Mockado usuário atual - em produção isso viria do contexto de autenticação
  const currentUser = {
    id: "user-123",
    name: "Ana Silva",
    role: "auctioneer", // "auctioneer", "supplier", "authority", "citizen"
    company: "Prefeitura Municipal",
  };
  
  // Verificações de permissão baseadas no usuário mockado
  // Em produção, essas verificações viriam de um contexto de autenticação real
  const isAuctioneer = currentUser.role === "auctioneer";
  const isSupplier = currentUser.role === "supplier";
  const isAuthority = currentUser.role === "authority";
  const supplierId = isSupplier ? "supplier-001" : undefined;

  // Função para enviar mensagem do chat
  const handleChatMessage = (content: string) => {
    addChatMessage(
      content, 
      currentUser.id, 
      currentUser.name, 
      currentUser.role
    );
  };

  // Função para formatar data/hora
  const formatDateTime = (dateStr: string | Date) => {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="container py-6 max-w-screen-xl mx-auto">
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href={`/tenders/${tenderId}`} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar para licitação
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            Fase Recursal - {tenderData.title}
          </h1>
          <p className="text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Sessão iniciada em: {formatDateTime(new Date())}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-amber-600">
            <Scale className="h-4 w-4 mr-1" />
            Fase Recursal
          </Badge>
          <div className="text-sm text-gray-600">
            {currentUser.name} ({currentUser.role})
          </div>
        </div>
      </div>

      {/* Informações da Licitação */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Informações do Lote {lotData.number}</CardTitle>
          <CardDescription>
            {lotData.name} - {lotData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm mb-1">Objeto:</h3>
              <p className="text-sm text-gray-700">{lotData.description}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Valor estimado:</h3>
              <p className="text-sm text-gray-700">R$ {lotData.estimatedValue?.toFixed(2)}</p>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              O sistema identifica automaticamente a fase de recursos e permite realizar os trâmites
              conforme a Lei de Licitações e o Regulamento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Conteúdo principal - Recursos e Decisões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Gestão de Recursos */}
          <ResourceManagement
            lotId={lotId}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            supplierId={supplierId}
          />

          {/* Área de decisões da autoridade superior */}
          {(isAuctioneer || isAuthority) && (
            <AuthorityDecisionsControls
              lotId={lotId}
              isAuctioneer={isAuctioneer}
              isAuthority={isAuthority}
            />
          )}
        </div>

        {/* Painel lateral com chat e informações */}
        <div className="space-y-6">
          {/* Mensagens do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Mensagens do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {systemMessages.length > 0 ? (
                <div className="space-y-3">
                  {systemMessages
                    .slice()
                    .reverse()
                    .map((message) => (
                      <div key={message.id} className="p-3 bg-blue-50 rounded-md text-sm">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(message.timestamp), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                        <p>{message.content}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma mensagem do sistema ainda.</p>
              )}
            </CardContent>
          </Card>

          {/* Chat da Sessão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chat da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <DisputeChat
                tenderId={tenderId}
                activeLotId={lotId}
                isAuctioneer={isAuctioneer}
                isSupplier={isSupplier}
                isCitizen={false}
                userId={currentUser.id}
                status={isChatEnabled ? "active" : "disabled"}
              />
            </CardContent>
          </Card>

          {/* Prazos e Cronograma */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    <span className="text-sm">Manifestação de interesse</span>
                  </div>
                  <span className="text-sm font-mono">3 horas</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                    <span className="text-sm">Envio de razões</span>
                  </div>
                  <span className="text-sm font-mono">3 dias úteis</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                    <span className="text-sm">Contrarrazões</span>
                  </div>
                  <span className="text-sm font-mono">3 dias úteis</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                    <span className="text-sm">Julgamento</span>
                  </div>
                  <span className="text-sm font-mono">5 dias úteis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
