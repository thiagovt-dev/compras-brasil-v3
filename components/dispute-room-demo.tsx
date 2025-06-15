"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { DisputeHeader } from "@/components/dispute-header";
import { DisputeControls } from "@/components/dispute-controls";
import { Eye, Users } from "lucide-react";
import { DisputeLotsListDemo } from "./dispute-lots-list-demo";
import { DisputeRightPanelDemo } from "./dispute-right-panel-demo";
import { DisputeChatDemo } from "./dispute-chat-demo";

interface DisputeRoomDemoProps {
  tender: any;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  profile: any; // O profile real do usuário, que pode ser usado para simular o perfil da demo
}

// Dados mocados para o perfil do usuário na demo
const mockUserProfile = {
  id: "supplier-demo-001", // ID de usuário mocada para o fornecedor da demo
  name: "João Silva",
  company_name: "Fornecedora ABC",
  role: "supplier",
  supplierNumber: 23, // Novo campo para o número do fornecedor
};

// Dados mocados para o chat de demonstração (mantidos aqui para consistência com o mockUserProfile)
const mockMessages = [
  {
    id: "msg-001",
    user_id: "auctioneer-demo-001",
    message: "Bom dia! Iniciando a sessão de disputa do Lote 1 - Material Escolar Básico",
    message_type: "system",
    created_at: new Date(Date.now() - 300000).toISOString(),
    profiles: {
      name: "Maria Santos - Pregoeiro",
      role: "auctioneer",
    },
  },
  {
    id: "msg-002",
    user_id: mockUserProfile.id, // Usando o ID do perfil mocado
    message: "Bom dia! Empresa ABC presente e pronta para participar.",
    message_type: "chat",
    created_at: new Date(Date.now() - 240000).toISOString(),
    profiles: {
      name: mockUserProfile.name,
      role: mockUserProfile.role,
    },
  },
  {
    id: "msg-003",
    user_id: "supplier-demo-002",
    message: "Empresa XYZ também presente!",
    message_type: "chat",
    created_at: new Date(Date.now() - 180000).toISOString(),
    profiles: {
      name: "Pedro Costa - Fornecedora XYZ",
      role: "supplier",
    },
  },
  {
    id: "msg-004",
    user_id: "auctioneer-demo-001",
    message: "Perfeito! Temos 3 fornecedores habilitados. Iniciando a fase de lances.",
    message_type: "system",
    created_at: new Date(Date.now() - 120000).toISOString(),
    profiles: {
      name: "Maria Santos - Pregoeiro",
      role: "auctioneer",
    },
  },
  {
    id: "msg-005",
    user_id: mockUserProfile.id, // Usando o ID do perfil mocado
    message: "Lance enviado para o item 1!",
    message_type: "bid",
    created_at: new Date(Date.now() - 60000).toISOString(),
    profiles: {
      name: mockUserProfile.name,
      role: mockUserProfile.role,
    },
  },
];

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
  // Adicione mais dados para outros lotes conforme necessário
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
  // Adicione mais itens para outros lotes conforme necessário
};

export default function DisputeRoomDemo({
  tender,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId, // Este userId será o do usuário logado, não o mocado para o fornecedor da demo
  profile, // Este profile será o do usuário logado, não o mocado para o fornecedor da demo
}: DisputeRoomDemoProps) {
  const [disputeStatus, setDisputeStatus] = useState<string>("active");
  const [activeLot, setActiveLot] = useState<any>(tender.lots[0]); // Primeiro lote ativo
  const [lots, setLots] = useState<any[]>(tender.lots);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [disputeMode, setDisputeMode] = useState<string>("open");
  const [messages, setMessages] = useState(mockMessages);
  // Os bids e proposals não precisam ser passados diretamente para o DisputeRoomDemo,
  // pois serão gerenciados dentro de DisputeLotsListDemo e DisputeRightPanelDemo
  // const [bids, setBids] = useState(mockBids)
  // const [proposals, setProposals] = useState(mockProposals)

  const { toast } = useToast();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simular chegada de novas mensagens e lances (mantido para simular atividade geral)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular nova mensagem ocasionalmente
      if (Math.random() < 0.1) {
        const randomSupplierId = Math.random() > 0.5 ? "supplier-demo-002" : "supplier-demo-003";
        const randomSupplierName =
          randomSupplierId === "supplier-demo-002"
            ? "Pedro Costa - Fornecedora XYZ"
            : "Ana Lima - Fornecedora 123";
        const newMessage = {
          id: `msg-${Date.now()}`,
          user_id: randomSupplierId,
          message:
            Math.random() > 0.5
              ? "Aguardando próximo item..."
              : "Sistema funcionando perfeitamente!",
          message_type: "chat",
          created_at: new Date().toISOString(),
          profiles: {
            name: randomSupplierName,
            role: "supplier",
          },
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
  // Usar o mockUserProfile para o supplierIdentifier na demo
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

      {/* Controles do Pregoeiro */}
      {isAuctioneer && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <DisputeControls
            tenderId={tender.id}
            status={disputeStatus}
            activeLot={activeLot}
            lots={lots}
            userId={userId}
          />
        </div>
      )}

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
            userId={mockUserProfile.id} // Passa o userId mocada para o chat
            profile={mockUserProfile} // Passa o profile mocada para o chat
            status={disputeStatus}
          />
        </div>

        {/* Coluna Central: Lista de Lotes com Lances - 50% da largura */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <DisputeLotsListDemo
            lots={lots}
            activeLot={activeLot}
            disputeStatus={disputeStatus}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            userId={mockUserProfile.id} // Passa o userId mocada para a lista de lotes
            profile={mockUserProfile} // Passa o profile mocada para a lista de lotes
            onSelectLot={setActiveLot}
          />
        </div>

        {/* Coluna da Direita: Painel de Detalhes do Lote Ativo - 25% da largura */}
        <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
          <DisputeRightPanelDemo
            activeLot={activeLot}
            // Passa as propostas e itens específicos do lote ativo
            lotProposals={activeLot ? mockLotProposals[activeLot.id] || [] : []}
            lotItems={activeLot ? mockLotItems[activeLot.id] || [] : []}
          />
        </div>
      </div>
    </div>
  );
}
