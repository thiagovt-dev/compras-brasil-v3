"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { DisputeHeader } from "@/components/dispute-header";
import { DisputeControls } from "@/components/dispute-controls";
import { Eye, Users } from "lucide-react";
import { DisputeMainContent } from "./dispute-main-content";

interface DisputeRoomDemoProps {
  tender: any;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  profile: any;
}

// Dados mocados para demonstração
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
    user_id: "supplier-demo-001",
    message: "Bom dia! Empresa ABC presente e pronta para participar.",
    message_type: "chat",
    created_at: new Date(Date.now() - 240000).toISOString(),
    profiles: {
      name: "João Silva - Fornecedora ABC",
      role: "supplier",
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
    user_id: "supplier-demo-001",
    message: "Lance enviado para o item 1!",
    message_type: "bid",
    created_at: new Date(Date.now() - 60000).toISOString(),
    profiles: {
      name: "João Silva - Fornecedora ABC",
      role: "supplier",
    },
  },
];

const mockBids = [
  {
    id: "bid-001",
    item_id: "item-001",
    user_id: "supplier-demo-001",
    value: 8.2,
    status: "active",
    created_at: new Date(Date.now() - 180000).toISOString(),
    profiles: {
      name: "Fornecedora ABC",
      company_name: "ABC Materiais Ltda",
    },
  },
  {
    id: "bid-002",
    item_id: "item-001",
    user_id: "supplier-demo-002",
    value: 8.1,
    status: "active",
    created_at: new Date(Date.now() - 120000).toISOString(),
    profiles: {
      name: "Fornecedora XYZ",
      company_name: "XYZ Suprimentos Ltda",
    },
  },
  {
    id: "bid-003",
    item_id: "item-001",
    user_id: "supplier-demo-001",
    value: 7.95,
    status: "winning",
    created_at: new Date(Date.now() - 60000).toISOString(),
    profiles: {
      name: "Fornecedora ABC",
      company_name: "ABC Materiais Ltda",
    },
  },
  {
    id: "bid-004",
    item_id: "item-002",
    user_id: "supplier-demo-002",
    value: 1.15,
    status: "winning",
    created_at: new Date(Date.now() - 90000).toISOString(),
    profiles: {
      name: "Fornecedora XYZ",
      company_name: "XYZ Suprimentos Ltda",
    },
  },
];

const mockProposals = [
  {
    id: "prop-001",
    lot_id: "lot-001",
    user_id: "supplier-demo-001",
    total_value: 41000.0,
    status: "submitted",
    created_at: new Date(Date.now() - 300000).toISOString(),
    profiles: {
      name: "Fornecedora ABC",
      company_name: "ABC Materiais Ltda",
    },
    items: [
      {
        item_id: "item-001",
        unit_price: 7.95,
        total_price: 39750.0,
      },
      {
        item_id: "item-002",
        unit_price: 1.25,
        total_price: 12500.0,
      },
    ],
  },
  {
    id: "prop-002",
    lot_id: "lot-001",
    user_id: "supplier-demo-002",
    total_value: 42500.0,
    status: "submitted",
    created_at: new Date(Date.now() - 240000).toISOString(),
    profiles: {
      name: "Fornecedora XYZ",
      company_name: "XYZ Suprimentos Ltda",
    },
    items: [
      {
        item_id: "item-001",
        unit_price: 8.1,
        total_price: 40500.0,
      },
      {
        item_id: "item-002",
        unit_price: 1.15,
        total_price: 11500.0,
      },
    ],
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
  const [disputeStatus, setDisputeStatus] = useState<string>("active");
  const [activeLot, setActiveLot] = useState<any>(tender.lots[0]); // Primeiro lote ativo
  const [lots, setLots] = useState<any[]>(tender.lots);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [disputeMode, setDisputeMode] = useState<string>("open");
  const [messages, setMessages] = useState(mockMessages);
  const [bids, setBids] = useState(mockBids);
  const [proposals, setProposals] = useState(mockProposals);

  const { toast } = useToast();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simular chegada de novas mensagens e lances
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular nova mensagem ocasionalmente
      if (Math.random() < 0.1) {
        // 10% de chance a cada 5 segundos
        const newMessage = {
          id: `msg-${Date.now()}`,
          user_id: Math.random() > 0.5 ? "supplier-demo-002" : "supplier-demo-003",
          message:
            Math.random() > 0.5
              ? "Aguardando próximo item..."
              : "Sistema funcionando perfeitamente!",
          message_type: "chat",
          created_at: new Date().toISOString(),
          profiles: {
            name:
              Math.random() > 0.5 ? "Pedro Costa - Fornecedora XYZ" : "Ana Lima - Fornecedora 123",
            role: "supplier",
          },
        };
        setMessages((prev) => [...prev, newMessage]);
      }

      // Simular novo lance ocasionalmente
      if (Math.random() < 0.05) {
        // 5% de chance
        const currentBest = Math.min(
          ...bids.filter((b) => b.item_id === "item-001").map((b) => b.value)
        );
        const newBid = {
          id: `bid-${Date.now()}`,
          item_id: "item-001",
          user_id: "supplier-demo-003",
          value: Number((currentBest - 0.05).toFixed(2)),
          status: "winning",
          created_at: new Date().toISOString(),
          profiles: {
            name: "Fornecedora 123",
            company_name: "123 Materiais Ltda",
          },
        };
        setBids((prev) => [
          ...prev.map((b) => ({ ...b, status: b.item_id === "item-001" ? "active" : b.status })),
          newBid,
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bids]);

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
  const supplierIdentifier = isSupplier
    ? `FORNECEDOR ${userId.substring(0, 8).toUpperCase()}`
    : null;

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
        {/* Chat - 25% */}
        <div className="w-1/4 bg-white border-r border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Chat da Sessão</h3>
              <p className="text-sm text-gray-500">
                {messages.length} mensagens • {disputeStatus === "active" ? "Ativo" : "Aguardando"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      {message.profiles.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={`text-sm p-2 rounded ${
                      message.message_type === "system"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : message.message_type === "bid"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-gray-50 text-gray-800"
                    }`}>
                    {message.message}
                  </div>
                </div>
              ))}
            </div>
            {(isAuctioneer || isSupplier) && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const newMessage = {
                          id: `msg-${Date.now()}`,
                          user_id: userId,
                          message: e.currentTarget.value.trim(),
                          message_type: "chat",
                          created_at: new Date().toISOString(),
                          profiles: {
                            name: profile.name,
                            role: profile.role,
                          },
                        };
                        setMessages((prev) => [...prev, newMessage]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal - 50% */}
        <div className="w-1/2 bg-gray-50">
          <DisputeMainContent
            tenderId={tender.id}
            activeLot={activeLot}
            disputeStatus={disputeStatus}
            disputeMode={disputeMode}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            userId={userId}
            profile={profile}
          />
        </div>

        {/* Painel Direito - 25% */}
        <div className="w-1/4 bg-white border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Lances e Propostas</h3>
              <p className="text-sm text-gray-500">{bids.length} lances enviados</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Lances Recentes */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Lances Recentes</h4>
                <div className="space-y-2">
                  {bids
                    .slice(-5)
                    .reverse()
                    .map((bid) => (
                      <div
                        key={bid.id}
                        className={`p-3 rounded-lg border ${
                          bid.status === "winning"
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              R$ {bid.value.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">{bid.profiles.name}</p>
                          </div>
                          {bid.status === "winning" && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Vencendo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(bid.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Propostas */}
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Propostas do Lote</h4>
                <div className="space-y-2">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            R${" "}
                            {proposal.total_value.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-600">{proposal.profiles.name}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Enviada
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(proposal.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Área de Lance (apenas para fornecedores) */}
            {isSupplier && activeLot && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Enviar Lance</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">Valor Unitário</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button
                    className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    onClick={() => {
                      toast({
                        title: "Lance Enviado!",
                        description: "Seu lance foi registrado com sucesso.",
                      });
                    }}>
                    Enviar Lance
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
