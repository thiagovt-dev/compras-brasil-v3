"use client";

import { useState, useEffect } from "react";
import { TenderWorkflowProvider, useTenderWorkflow } from "@/lib/contexts/tender-workflow-context";
import ResourceManagement from "@/components/resource-management";
import AuthorityDecisionsControls from "@/components/authority-decisions-controls";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calendar, Clock, FileText, Info, MessageSquare, Scale } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export function ResourcePhaseDemoContent({ lotId }: { lotId: string }) {
  const {
    lots,
    systemMessages,
    chatMessages,
    resourcePhase,
    setResourcePhase,
    addChatMessage,
    isChatEnabled,
    addSystemMessage,
    setChatEnabled,
    setManifestationDeadline,
    setResourceDeadline,
    setCounterArgumentDeadline,
  } = useTenderWorkflow();

  // Estados para o usuário simulado
  const [userType, setUserType] = useState<"auctioneer" | "supplier" | "authority" | "citizen">(
    "auctioneer"
  );

  // Simular diferentes tipos de usuário
  const getUserInfo = () => {
    switch (userType) {
      case "auctioneer":
        return {
          isAuctioneer: true,
          isSupplier: false,
          isAuthority: false,
          isCitizen: false,
          userId: "auctioneer-demo-001",
          userRole: "auctioneer",
          userName: "Maria Santos",
          userCompany: "Prefeitura Municipal",
          supplierId: undefined,
        };
      case "supplier":
        return {
          isAuctioneer: false,
          isSupplier: true,
          isAuthority: false,
          isCitizen: false,
          userId: "supplier-demo-001",
          userRole: "supplier",
          userName: "João Silva",
          userCompany: "Fornecedora ABC Ltda",
          supplierId: "s1", // ID de um fornecedor simulado
        };
      case "authority":
        return {
          isAuctioneer: false,
          isSupplier: false,
          isAuthority: true,
          isCitizen: false,
          userId: "authority-demo-001",
          userRole: "authority",
          userName: "Dr. Paulo Autoridade",
          userCompany: "Prefeitura Municipal",
          supplierId: undefined,
        };
      case "citizen":
        return {
          isAuctioneer: false,
          isSupplier: false,
          isAuthority: false,
          isCitizen: true,
          userId: "citizen-demo-001",
          userRole: "citizen",
          userName: "Carlos Observador",
          userCompany: "",
          supplierId: undefined,
        };
      default:
        return {
          isAuctioneer: true,
          isSupplier: false,
          isAuthority: false,
          isCitizen: false,
          userId: "auctioneer-demo-001",
          userRole: "auctioneer",
          userName: "Maria Santos",
          userCompany: "Prefeitura Municipal",
          supplierId: undefined,
        };
    }
  };

  const userInfo = getUserInfo();

  // Configurar fase recursal para a demonstração
  useEffect(() => {
    // Definir fase recursal inicial
    setResourcePhase("manifestation_open");

    // Definir prazos
    const manifestationDeadline = new Date();
    manifestationDeadline.setHours(manifestationDeadline.getHours() + 3);
    setManifestationDeadline(manifestationDeadline);

    const resourceDeadline = new Date();
    resourceDeadline.setDate(resourceDeadline.getDate() + 3);
    setResourceDeadline(resourceDeadline);

    const counterArgumentDeadline = new Date();
    counterArgumentDeadline.setDate(counterArgumentDeadline.getDate() + 6);
    setCounterArgumentDeadline(counterArgumentDeadline);

    // Adicionar mensagem do sistema
    addSystemMessage(
      "O Pregoeiro/Agente de Contratação abriu a fase recursal para o item 001. O prazo para manifestação é até às " +
        format(manifestationDeadline, "HH:mm", { locale: ptBR }) +
        " do dia " +
        format(manifestationDeadline, "dd/MM/yyyy", { locale: ptBR }) +
        "."
    );

    // Habilitar chat
    setChatEnabled(true);
  }, []);

  // Função para obter detalhes do lote
  const getLotDetails = (id: string) => {
    return lots.find((lot) => lot.id === id);
  };

  // Para este exemplo, vamos usar um ID de lote fixo
  const currentLotId = "lot-001";
  const currentLot = getLotDetails(lotId);

  // Função para enviar mensagem do chat
  const handleChatMessage = (content: string) => {
    addChatMessage(content, userInfo.userId, userInfo.userName, userInfo.userRole);
  };

  // Função para formatar data/hora
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="container py-6 max-w-screen-xl mx-auto">
      {/* Barra de controle para alternar tipo de usuário */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-3 mb-6 -mx-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-yellow-800">🎭 MODO DEMONSTRAÇÃO</span>
            <span className="text-sm text-yellow-700">Visualizar como:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setUserType("auctioneer")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "auctioneer"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Pregoeiro
              </button>
              <button
                onClick={() => setUserType("supplier")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "supplier"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Fornecedor
              </button>
              <button
                onClick={() => setUserType("authority")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "authority"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Autoridade
              </button>
              <button
                onClick={() => setUserType("citizen")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "citizen"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Cidadão
              </button>
            </div>
          </div>
          <div className="text-sm text-yellow-700">Esta é uma demonstração com dados fictícios</div>
        </div>
      </div>

      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/demo/dispute" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar para disputa
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Fase Recursal - Pregão Eletrônico nº 23/2025</h1>
          <p className="text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Sessão iniciada em: {formatDateTime("2025-06-12T09:30:00Z")}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end">
          <Badge className="mb-2 bg-amber-600">
            <Scale className="h-4 w-4 mr-1" />
            Fase Recursal
          </Badge>
          <div className="text-sm text-gray-600">
            {userInfo.userName} ({userInfo.userRole})
          </div>
        </div>
      </div>

      {/* Informações da Licitação */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Informações do Lote {currentLot?.number}</CardTitle>
          <CardDescription>
            {currentLot?.name} - {currentLot?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm mb-1">Objeto:</h3>
              <p className="text-sm text-gray-700">{currentLot?.description}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Valor estimado:</h3>
              <p className="text-sm text-gray-700">R$ {currentLot?.estimatedValue?.toFixed(2)}</p>
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
            lotId={currentLotId}
            isAuctioneer={userInfo.isAuctioneer}
            isSupplier={userInfo.isSupplier}
            supplierId={userInfo.supplierId}
          />

          {/* Área de decisões da autoridade superior */}
          {(userInfo.isAuctioneer || userInfo.isAuthority) && (
            <AuthorityDecisionsControls
              lotId={currentLotId}
              isAuctioneer={userInfo.isAuctioneer}
              isAuthority={userInfo.isAuthority}
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
              <div className="p-4 text-center bg-gray-50 rounded-lg">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-600">
                  O chat está implementado na página real, mas na demonstração não está disponível
                  neste componente.
                </p>
                <Button
                  className="mt-4"
                  onClick={() =>
                    alert(
                      "Esta é apenas uma demonstração do chat. Na versão completa, os usuários podem conversar em tempo real."
                    )
                  }>
                  Simular Mensagem
                </Button>
              </div>
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

export default function ResourcePhaseDemoPage() {
  return (
    <TenderWorkflowProvider>
      <ResourcePhaseDemoContent lotId="lot-001" />
    </TenderWorkflowProvider>
  );
}
