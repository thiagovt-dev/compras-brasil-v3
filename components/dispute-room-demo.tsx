"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { DisputeHeader } from "@/components/dispute-header";
import { Eye, Users } from "lucide-react";
import { DisputeLotsListDemo } from "./dispute-lots-list-demo";
import { DisputeRightPanelDemo } from "./dispute-right-panel-demo";
import { DisputeChatDemo } from "./dispute-chat-demo";
import { DisputeModeSelectorDemo } from "./dispute-mode-selector-demo";
import { DisputeTimerDemo } from "./dispute-timer-demo";
import { DisputeModeIndicator } from "./dispute-mode-indicator";

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
const mockLotProposals: Record<string, any[]> = {
  "lot-001": [
    { id: "p1", user_id: "supplier-23", name: "FORNECEDOR 23", value: 2890.0 },
    { id: "p2", user_id: "supplier-03", name: "FORNECEDOR 03", value: 2900.0 },
    { id: "p3", user_id: "supplier-14", name: "FORNECEDOR 14", value: 2900.0 },
    { id: "p4", user_id: "supplier-24", name: "FORNECEDOR 24", value: 2900.0 },
    { id: "p5", user_id: "supplier-11", name: "FORNECEDOR 11", value: 2904.0 },
    { id: "p6", user_id: "supplier-13", name: "FORNECEDOR 13", value: 2904.0 },
    { id: "p7", user_id: "supplier-12", name: "FORNECEDOR 12", value: 3450.0 },
  ],
  "lot-002": [
    { id: "p8", user_id: "supplier-05", name: "FORNECEDOR 05", value: 110.0 },
    { id: "p9", user_id: "supplier-18", name: "FORNECEDOR 18", value: 115.0 },
  ],
  "lot-003": [
    { id: "p10", user_id: "supplier-01", name: "FORNECEDOR 01", value: 48.0 },
    { id: "p11", user_id: "supplier-07", name: "FORNECEDOR 07", value: 49.5 },
  ],
};

// Dados mocados para itens do lote por lote
const mockLotItems: Record<string, any[]> = {
  "lot-001": [
    {
      id: "item-001",
      description: "Caneta Esferográfica Azul",
      reference: "CX-100",
      quantity: 500,
      unit: "unidade",
      value: 0.8,
    },
    {
      id: "item-002",
      description: "Caderno Espiral 96 Folhas",
      reference: "UN-001",
      quantity: 100,
      unit: "unidade",
      value: 5.5,
    },
  ],
  "lot-002": [
    {
      id: "item-003",
      description: "Mesa Escolar Individual",
      reference: "MOB-001",
      quantity: 20,
      unit: "unidade",
      value: 120.0,
    },
  ],
  "lot-003": [
    {
      id: "item-004",
      description: "Cadeira Ergonômica",
      reference: "MOB-002",
      quantity: 30,
      unit: "unidade",
      value: 50.0,
    },
    {
      id: "item-005",
      description: "Armário de Aço",
      reference: "MOB-003",
      quantity: 5,
      unit: "unidade",
      value: 200.0,
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
  const [disputeStatus, setDisputeStatus] = useState<string>("active");
  const [disputeMode, setDisputeMode] = useState<string>("open");
  const [activeLot, setActiveLot] = useState<any>(tender.lots[0]);
  const [lots, setLots] = useState<any[]>(tender.lots);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerActive, setTimerActive] = useState(true);

  const { toast } = useToast();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleModeChange = (newMode: string) => {
    console.log("DisputeRoomDemo: Changing mode to", newMode);
    setDisputeMode(newMode);
    setTimerActive(false);
    setTimeout(() => setTimerActive(true), 100); // Reset timer

    toast({
      title: "Modo de Disputa Alterado",
      description: `Demonstração configurada para modo: ${getModeName(newMode)}`,
      duration: 3000,
    });
  };

  const getModeName = (mode: string) => {
    const modeNames: Record<string, string> = {
      open: "Aberto",
      open_restart: "Aberto (com reinício)",
      closed: "Fechado",
      open_closed: "Aberto e Fechado",
      closed_open: "Fechado e Aberto",
      random: "Randômico",
    };
    return modeNames[mode] || mode;
  };

  useEffect(() => {
    console.log("DisputeRoomDemo: Current disputeMode is", disputeMode);
  }, [disputeMode]);

  const handleTimerEnd = () => {
    toast({
      title: "Tempo Encerrado",
      description: "O tempo da disputa foi encerrado.",
    });
  };

  const handleTimerExtension = () => {
    toast({
      title: "Disputa Prorrogada",
      description: "A disputa foi prorrogada automaticamente.",
    });
  };

  const getUserTypeInfo = () => {
    if (isAuctioneer) {
      return {
        icon: <Users className="h-5 w-5" />,
        label: "Pregoeiro",
        description: "Você pode gerenciar esta disputa",
        variant: "default" as const,
      };
    }
    if (isSupplier) {
      return {
        icon: <Users className="h-5 w-5" />,
        label: "Fornecedor",
        description: "Você pode participar desta disputa",
        variant: "default" as const,
      };
    }
    return {
      icon: <Eye className="h-5 w-5" />,
      label: "Observador",
      description: "Você pode acompanhar esta disputa",
      variant: "secondary" as const,
    };
  };

  const userInfo = getUserTypeInfo();
  const supplierIdentifier = isSupplier ? `FORNECEDOR ${mockUserProfile.supplierNumber}` : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header da Sala de Disputa */}
      <DisputeHeader
        tender={tender}
        disputeStatus={disputeStatus}
        currentTime={currentTime}
        userInfo={userInfo}
        supplierIdentifier={supplierIdentifier}
        disputeMode={disputeMode}
      />

      {/* Controles do Pregoeiro e Timer */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Indicador Visual do Modo */}
        <DisputeModeIndicator mode={disputeMode} />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <DisputeModeSelectorDemo
              currentMode={disputeMode}
              onModeChange={handleModeChange}
              isAuctioneer={isAuctioneer}
            />

            <DisputeTimerDemo
              mode={disputeMode}
              isActive={timerActive}
              onTimeEnd={handleTimerEnd}
              onExtension={handleTimerExtension}
              isAuctioneer={isAuctioneer}
            />
          </div>

          {isAuctioneer && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Demonstração:</span> Todos os recursos são simulados
            </div>
          )}
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex-1 flex">
        {/* Coluna da Esquerda: Chat - 25% */}
        <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
          <DisputeChatDemo
            tenderId={tender.id}
            activeLotId={activeLot?.id || null}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            isCitizen={isCitizen}
            userId={mockUserProfile.id}
            profile={mockUserProfile}
            status={disputeStatus}
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
