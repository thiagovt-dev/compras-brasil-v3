"use client";

import { useState, useEffect } from "react";
import { DisputeLotsListDemo } from "./dispute-lots-list-demo";
import { DisputeChatDemo } from "./dispute-chat-demo";
import { DisputeAuctioneerControls } from "./dispute-auctioneer-controls";
import { DisputeModeIndicator } from "./dispute-mode-indicator";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  Users, 
  MessageSquare, 
  Info, 
  Clock,
  Package,
  DollarSign,
  Gavel,
  User
} from "lucide-react";

interface DisputeRoomDemoProps {
  tender: any;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  profile: any;
}

// Dados mocados para o perfil do usuário na demo
const mockUserProfile = {
  id: "supplier-demo-001",
  name: "João Silva",
  company_name: "Fornecedora ABC",
  role: "supplier",
  supplierNumber: 23,
};

// Dados mocados para propostas classificadas por lote
const mockLots = [
  {
    id: "lot-001",
    name: "Material de Escritório",
    description: "Papel, canetas, grampeadores e materiais diversos",
    estimatedValue: 15000.00,
  },
  {
    id: "lot-002", 
    name: "Equipamentos de Informática",
    description: "Computadores, monitores e periféricos",
    estimatedValue: 25000.00,
  },
  {
    id: "lot-003",
    name: "Material de Limpeza", 
    description: "Produtos de higiene e limpeza em geral",
    estimatedValue: 8000.00,
  },
];

export default function DisputeRoomDemo({
  tender,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  profile,
}: DisputeRoomDemoProps) {
  const [disputeStatus, setDisputeStatus] = useState("active");
  const [disputeMode, setDisputeMode] = useState("open");
  const [activeLot, setActiveLot] = useState(mockLots[0]);
  const [lots] = useState(mockLots);
  
  // Estado para controlar quais lotes foram finalizados e devem mostrar controles
  const [finalizedLots, setFinalizedLots] = useState<Set<string>>(new Set());
  
  // Estado para armazenar mensagens do sistema que serão enviadas para o chat
  const [systemMessages, setSystemMessages] = useState<Array<{ message: string; type: "system" | "auctioneer" }>>([]);
  
  // Inicializar lotes com status variados para demonstração
  const [lotStatuses, setLotStatuses] = useState<Record<string, string>>({
    "lot-001": "open", // Em disputa
    "lot-002": "waiting", // Aguardando
    "lot-003": "open", // Em disputa
  });

  const { toast } = useToast();

  // Função chamada quando a disputa é finalizada pelo timer
  const handleDisputeCompleted = (lotId: string) => {
    console.log("🎯 handleDisputeCompleted chamada para lote:", lotId);
    
    // Adicionar o lote específico à lista de finalizados
    setFinalizedLots((prev) => new Set([...prev, lotId]));
    
    // Atualizar status do lote para finalizado
    setLotStatuses((prev) => ({ ...prev, [lotId]: "finished" }));
    
    toast({
      title: "Disputa Finalizada - Controles Disponíveis",
      description: `A disputa do lote ${lotId} foi finalizada. Controles do pregoeiro agora disponíveis.`,
      duration: 5000,
    });
  };

  const handleFinalizeLot = (lotId: string) => {
    console.log("🎯 handleFinalizeLot chamada para lote:", lotId);
    
    // Esta função agora será chamada pelo timer
    handleDisputeCompleted(lotId);
  };

  const handleStartLot = (lotId: string) => {
    setLotStatuses((prev) => ({ ...prev, [lotId]: "open" }));
    toast({
      title: "Lote Iniciado",
      description: `Disputa do lote ${lotId} foi iniciada.`,
    });
  };

  const handleTimerEnd = (lotId: string) => {
    console.log("Timer ended for lot:", lotId);
  };

  const handleChatMessage = (message: string, type: "system" | "auctioneer") => {
    console.log("Chat message:", message, "Type:", type);
    
    // Adicionar a mensagem ao estado para ser enviada ao chat
    setSystemMessages(prev => [...prev, { message, type }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header da Sala */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Sala de Disputa - {tender?.number || "Pregão Demo"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {tender?.title || "Demonstração do Sistema de Pregão Eletrônico"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Users className="h-4 w-4 mr-1" />
              15 Participantes
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-4 w-4 mr-1" />
              Sessão Pública
            </Badge>
          </div>
        </div>
      </div>

      {/* Controles do Pregoeiro */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Indicador Visual do Modo */}
        <DisputeModeIndicator mode={disputeMode} />

        {/* CONTROLES DO PREGOEIRO - Só mostram se finalizedLots tem itens */}
        {isAuctioneer && finalizedLots.size > 0 && (
          <div className="border-t pt-4">
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✅ Disputas finalizadas! Os controles do pregoeiro estão agora disponíveis para os
                lotes: {Array.from(finalizedLots).join(", ")}.
              </p>
            </div>
            <DisputeAuctioneerControls
              lots={lots.filter((lot) => finalizedLots.has(lot.id))} // Filtrar apenas lotes finalizados
              onChatMessage={handleChatMessage}
              showControls={true}
              onDisputeFinalized={handleDisputeCompleted}
            />
          </div>
        )}

        {/* Mostrar mensagem se for pregoeiro mas controles não estão disponíveis */}
        {isAuctioneer && finalizedLots.size === 0 && (
          <div className="border-t pt-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Pregoeiro:</strong> Finalize pelo menos uma disputa usando o botão
                "Finalizar" no timer para acessar os controles de declaração de vencedor e fase
                recursal.
              </p>
            </div>
          </div>
        )}

        {/* Perfil do usuário atual */}
        {(isSupplier || isCitizen) && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium text-sm">
                  {isSupplier ? `Fornecedor #${mockUserProfile.supplierNumber}` : "Cidadão"}
                </div>
                <div className="text-xs text-gray-600">
                  {mockUserProfile.name} - {mockUserProfile.company_name}
                </div>
              </div>
              <Badge variant={isSupplier ? "default" : "secondary"}>
                {isSupplier ? "Participante" : "Observador"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Layout Principal */}
      <div className="flex-1 flex">
        {/* Coluna Esquerda: Informações da Licitação */}
        <div className="w-1/4 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Informações Gerais */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informações da Licitação</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Número:</span>
                  <span className="ml-2 font-medium">{tender?.number || "001/2024"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Órgão:</span>
                  <span className="ml-2">{tender?.agency || "Prefeitura Municipal"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Modalidade:</span>
                  <span className="ml-2">Pregão Eletrônico</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <Badge className="ml-2 bg-green-600">Em Disputa</Badge>
                </div>
              </div>
            </div>

            {/* Resumo dos Lotes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resumo dos Lotes</h3>
              <div className="space-y-2">
                {lots.map((lot, index) => {
                  const status = lotStatuses[lot.id];
                  const isFinalized = finalizedLots.has(lot.id);

                  return (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>Lote {index + 1}</span>
                      </div>
                      <Badge
                        variant={
                          isFinalized ? "default" : status === "open" ? "destructive" : "secondary"
                        }
                        className={
                          isFinalized ? "bg-orange-500" : status === "open" ? "bg-green-600" : ""
                        }>
                        {isFinalized
                          ? "Finalizado"
                          : status === "open"
                          ? "Em Disputa"
                          : "Aguardando"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Estatísticas */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">15</div>
                  <div className="text-xs text-blue-600">Fornecedores</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">247</div>
                  <div className="text-xs text-green-600">Lances</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-600">{finalizedLots.size}</div>
                  <div className="text-xs text-purple-600">Finalizados</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {lots.length - finalizedLots.size}
                  </div>
                  <div className="text-xs text-orange-600">Ativos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Central: Lista de Lotes com Lances */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <DisputeLotsListDemo
            lots={lots}
            activeLot={activeLot}
            disputeStatus={disputeStatus}
            disputeMode={disputeMode}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            userId={mockUserProfile.id}
            profile={mockUserProfile}
            onSelectLot={setActiveLot}
            lotStatuses={lotStatuses}
            onTimerEnd={handleTimerEnd}
            onFinalizeLot={handleFinalizeLot}
            onStartLot={handleStartLot}
            onDisputeFinalized={handleDisputeCompleted}
          />
        </div>

        {/* Coluna Direita: Chat */}
        <div className="w-1/4 bg-white border-l border-gray-200">
          <DisputeChatDemo
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            isCitizen={isCitizen}
            userId={mockUserProfile.id}
            profile={mockUserProfile}
            tenderId={tender?.id || "demo"}
            activeLotId={activeLot?.id || null}
            status={disputeStatus}
            systemMessages={systemMessages}
          />
        </div>
      </div>
    </div>
  );
}