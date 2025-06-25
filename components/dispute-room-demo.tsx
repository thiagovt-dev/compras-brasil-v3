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
  User,
} from "lucide-react";
import { DisputeRightPanelDemo } from "./dispute-right-panel-demo";

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
    estimatedValue: 15000.0,
  },
  {
    id: "lot-002",
    name: "Equipamentos de Informática",
    description: "Computadores, monitores e periféricos",
    estimatedValue: 25000.0,
  },
  {
    id: "lot-003",
    name: "Material de Limpeza",
    description: "Produtos de higiene e limpeza em geral",
    estimatedValue: 8000.0,
  },
];

// Dados mocados para propostas dos lotes
const mockLotProposals: Record<string, any[]> = {
  "lot-001": [
    {
      id: "prop-001",
      supplier_id: "supplier-001",
      supplier_name: "FORNECEDOR 15",
      name: "FORNECEDOR 15",
      company_name: "Tech Solutions LTDA",
      value: 2890.0,
      status: "classified",
      position: 1,
    },
    {
      id: "prop-002",
      supplier_id: "supplier-002",
      supplier_name: "FORNECEDOR 22",
      name: "FORNECEDOR 22",
      company_name: "Inovação Digital ME",
      value: 2900.0,
      status: "classified",
      position: 2,
    },
    {
      id: "prop-003",
      supplier_id: "supplier-003",
      supplier_name: "FORNECEDOR 8",
      name: "FORNECEDOR 8",
      company_name: "Sistemas Avançados S.A.",
      value: 2904.0,
      status: "classified",
      position: 3,
    },
  ],
  "lot-002": [
    {
      id: "prop-004",
      supplier_id: "supplier-004",
      supplier_name: "FORNECEDOR 5",
      name: "FORNECEDOR 5",
      company_name: "Fornecedora Premium LTDA",
      value: 110.0,
      status: "classified",
      position: 1,
    },
    {
      id: "prop-005",
      supplier_id: "supplier-005",
      supplier_name: "FORNECEDOR 18",
      name: "FORNECEDOR 18",
      company_name: "Distribuidora Central ME",
      value: 115.0,
      status: "classified",
      position: 2,
    },
  ],
  "lot-003": [
    {
      id: "prop-006",
      supplier_id: "supplier-006",
      supplier_name: "FORNECEDOR 1",
      name: "FORNECEDOR 1",
      company_name: "Comercial Norte S.A.",
      value: 48.0,
      status: "classified",
      position: 1,
    },
    {
      id: "prop-007",
      supplier_id: "supplier-007",
      supplier_name: "FORNECEDOR 7",
      name: "FORNECEDOR 7",
      company_name: "Suprimentos Sul LTDA",
      value: 49.5,
      status: "classified",
      position: 2,
    },
  ],
};

// Dados mocados para itens dos lotes
const mockLotItems: Record<string, any[]> = {
  "lot-001": [
    {
      id: "item-001",
      description: "Caderno universitário 200 folhas",
      reference: "• 5000 unidade",
      quantity: 5000,
      unit: "unidade",
      estimated_unit_price: 8.5,
      estimated_total_price: 42500.0,
      value: 42500.0,
    },
    {
      id: "item-002",
      description: "Lápis preto nº 2",
      reference: "• 10000 unidade",
      quantity: 10000,
      unit: "unidade",
      estimated_unit_price: 1.2,
      estimated_total_price: 12000.0,
      value: 12000.0,
    },
    {
      id: "item-003",
      description: "Caneta esferográfica azul",
      reference: "• 3000 unidade",
      quantity: 3000,
      unit: "unidade",
      estimated_unit_price: 2.5,
      estimated_total_price: 7500.0,
      value: 7500.0,
    },
  ],
  "lot-002": [
    {
      id: "item-004",
      description: "Computador Desktop",
      reference: "• 50 unidade",
      quantity: 50,
      unit: "unidade",
      estimated_unit_price: 2500.0,
      estimated_total_price: 125000.0,
      value: 125000.0,
    },
    {
      id: "item-005",
      description: "Monitor LED 21 polegadas",
      reference: "• 50 unidade",
      quantity: 50,
      unit: "unidade",
      estimated_unit_price: 800.0,
      estimated_total_price: 40000.0,
      value: 40000.0,
    },
  ],
  "lot-003": [
    {
      id: "item-006",
      description: "Detergente neutro 5L",
      reference: "• 200 unidade",
      quantity: 200,
      unit: "unidade",
      estimated_unit_price: 12.5,
      estimated_total_price: 2500.0,
      value: 2500.0,
    },
    {
      id: "item-007",
      description: "Papel higiênico 30m",
      reference: "• 1000 rolo",
      quantity: 1000,
      unit: "rolo",
      estimated_unit_price: 3.8,
      estimated_total_price: 3800.0,
      value: 3800.0,
    },
  ],
};

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
  const [systemMessages, setSystemMessages] = useState<
    Array<{ message: string; type: "system" | "auctioneer" }>
  >([]);

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
    setSystemMessages((prev) => [...prev, { message, type }]);
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
                  {isSupplier
                    ? `Fornecedor #${profile?.supplierNumber || mockUserProfile.supplierNumber}`
                    : "Cidadão"}
                </div>
                <div className="text-xs text-gray-600">
                  {profile?.name || mockUserProfile.name} -{" "}
                  {profile?.company_name || mockUserProfile.company_name}
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
        {/* Coluna da Esquerda: Chat - 25% */}
        <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
          <DisputeChatDemo
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            isCitizen={isCitizen}
            userId={profile?.id || mockUserProfile.id}
            profile={profile || mockUserProfile}
            tenderId={tender?.id || "demo"}
            activeLotId={activeLot?.id || null}
            status={disputeStatus}
            systemMessages={systemMessages}
          />
        </div>

        {/* Coluna Central: Lista de Lotes com Lances - 50% da largura */}
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

        {/* Coluna da Direita: Painel de Detalhes do Lote Ativo - 25% da largura */}
        <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
          <DisputeRightPanelDemo
            activeLot={activeLot}
            lotProposals={activeLot ? mockLotProposals[activeLot.id] || [] : []}
            lotItems={activeLot ? mockLotItems[activeLot.id] || [] : []}
          />
        </div>
      </div>
    </div>
  );
}
