"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, Timer, AlertCircle, CheckCircle, Clock, Target, Trophy, Play, Trash2, Shuffle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DisputeTimerDemo } from "./dispute-timer-demo";

interface DisputeLotsListDemoProps {
  lots: any[];
  activeLot: any | null;
  disputeStatus: string;
  disputeMode: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  userId: string;
  profile: {
    id: string;
    name: string;
    company_name: string;
    role: string;
    supplierNumber?: number;
  } | null;
  onSelectLot: (lot: any) => void;
  // Novas props opcionais para controle de status dos lotes
  lotStatuses?: Record<string, string>;
  onTimerEnd?: (lotId: string) => void;
  onFinalizeLot?: (lotId: string) => void;
  onStartLot?: (lotId: string) => void;
  onDisputeFinalized?: (lotId: string) => void;
  // NOVA PROP: Dados de desempate
  tiebreakerData?: Record<string, {
    isActive: boolean;
    timeLeft: number;
    suppliers: string[];
  }>;
}

// Status individuais por lote (fallback local se não fornecido via props)
const mockLotStatuses: Record<string, string> = {
  "lot-001": "open",
  "lot-002": "waiting", 
  "lot-003": "open",
  "lot-004": "waiting",
  "lot-005": "finished",
  "lot-006": "open",
  "lot-007": "waiting",
  "lot-008": "open",
  "lot-009": "waiting",
  "lot-010": "finished",
};

// Dados mocados para demonstração
const mockLotBids: Record<
  string,
  Array<{ 
    id: string;
    value: number; 
    is_percentage: boolean; 
    profiles: { name: string; company_name: string };
    timestamp: string;
    isUserBid?: boolean; // Flag para identificar lances do usuário
  }>
> = {
  "lot-001": [
    {
      id: "bid-1",
      value: 8.2,
      is_percentage: false,
      profiles: { name: "Fornecedor 15", company_name: "Empresa 15 Ltda" },
      timestamp: new Date(Date.now() - 30000).toISOString(),
    },
    {
      id: "bid-2", 
      value: 8.5,
      is_percentage: false,
      profiles: { name: "Fornecedor 22", company_name: "Empresa 22 Ltda" },
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
  ],
  "lot-002": [
    {
      id: "bid-3",
      value: 120.0,
      is_percentage: false,
      profiles: { name: "Fornecedor 8", company_name: "Empresa 8 Ltda" },
      timestamp: new Date(Date.now() - 45000).toISOString(),
    },
  ],
  "lot-003": [
    {
      id: "bid-4",
      value: 50.0,
      is_percentage: false,
      profiles: { name: "Fornecedor 22", company_name: "Empresa 22 Ltda" },
      timestamp: new Date(Date.now() - 90000).toISOString(),
    },
  ],
};

export function DisputeLotsListDemo({
  lots,
  activeLot,
  disputeStatus,
  disputeMode,
  isAuctioneer,
  isSupplier,
  userId,
  profile,
  onSelectLot,
  // Novas props com valores padrão
  lotStatuses: externalLotStatuses,
  onTimerEnd: externalOnTimerEnd,
  onFinalizeLot: externalOnFinalizeLot,
  onStartLot: externalOnStartLot,
  onDisputeFinalized,
  tiebreakerData = {}, // NOVA PROP com valor padrão
}: DisputeLotsListDemoProps) {
  const [newBidValues, setNewBidValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [lotBids, setLotBids] = useState<Record<string, any[]>>(mockLotBids);
  
  // Novo estado para controlar lances recentes do usuário (para o botão de cancelar)
  const [recentUserBids, setRecentUserBids] = useState<Record<string, {
    bidId: string;
    timestamp: Date;
    canCancel: boolean;
  }>>({});

  // Usar status externos se fornecidos, senão usar os mockados locais
  const [lotStatuses, setLotStatuses] = useState<Record<string, string>>(
    externalLotStatuses || mockLotStatuses
  );

  const [lotParticipants, setLotParticipants] = useState<Record<string, number>>({
    "lot-001": 3,
    "lot-002": 2,
    "lot-003": 4,
    "lot-004": 3,
    "lot-005": 2,
    "lot-006": 5,
    "lot-007": 3,
    "lot-008": 4,
    "lot-009": 2,
    "lot-010": 3,
  });

  const cancelTimerRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const { toast } = useToast();

  // Atualizar status locais quando os externos mudarem
  useEffect(() => {
    if (externalLotStatuses) {
      setLotStatuses(externalLotStatuses);
    }
  }, [externalLotStatuses]);

  // Função para obter o número do lote baseado no índice
  const getLotNumber = (lotId: string) => {
    const lotIndex = lots.findIndex(lot => lot.id === lotId);
    return lotIndex >= 0 ? lotIndex + 1 : 1;
  };

  // NOVA FUNÇÃO: Formatar tempo de desempate
  const formatTiebreakerTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Funções locais que usam as callbacks externas se disponíveis
  const handleTimerEnd = (lotId: string) => {
    if (externalOnTimerEnd) {
      externalOnTimerEnd(lotId);
    } else {
      setLotStatuses((prev) => ({ ...prev, [lotId]: "finished" }));
      toast({
        title: "Tempo Encerrado",
        description: `O tempo da disputa do Lote ${getLotNumber(lotId)} foi encerrado.`,
      });
    }
  };

  const handleFinalizeLot = (lotId: string) => {
    if (externalOnFinalizeLot) {
      externalOnFinalizeLot(lotId);
    } else {
      setLotStatuses((prev) => ({ ...prev, [lotId]: "finished" }));
      toast({
        title: "Lote Finalizado",
        description: `Pregoeiro finalizou a disputa do Lote ${getLotNumber(lotId)}.`,
      });
    }
  };

  const handleStartLot = (lotId: string) => {
    if (externalOnStartLot) {
      externalOnStartLot(lotId);
    } else if (isAuctioneer) {
      setLotStatuses((prev) => ({ ...prev, [lotId]: "open" }));
      toast({
        title: "Lote Iniciado",
        description: `Disputa do Lote ${getLotNumber(lotId)} foi iniciada.`,
      });
    }
  };

  // Função para formatação de moeda
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    const number = parseFloat(numericValue) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  const parseCurrencyToNumber = (formattedValue: string): number => {
    const numericString = formattedValue
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(numericString) || 0;
  };

  const handleBidInputChange = (lotId: string, value: string) => {
    const formattedValue = formatCurrency(value);
    setNewBidValues((prev) => ({ ...prev, [lotId]: formattedValue }));
  };

  // Simular mudanças nos lances baseado no modo de disputa
  useEffect(() => {
    if (disputeMode === "closed") return;

    const interval = setInterval(
      () => {
        setLotBids((prevBids) => {
          const updatedBids = { ...prevBids };
          for (const lotId in updatedBids) {
            // NOVA LÓGICA: Verificar se está em desempate
            const tiebreakerInfo = tiebreakerData[lotId];
            const isInTiebreaker = tiebreakerInfo?.isActive || false;
            
            // Continuar simulando lances para lotes em disputa normal ou em desempate
            if ((lotStatuses[lotId] === "open" || isInTiebreaker) && Math.random() < 0.15) {
              const randomValue = 50 + Math.random() * 100; // Valores aleatórios entre R$ 50 e R$ 150
              const randomSupplierNumber = Math.floor(Math.random() * 30) + 1;

              const newBid = {
                id: `bid-${Date.now()}-${Math.random()}`,
                value: Number(randomValue.toFixed(2)),
                is_percentage: false,
                profiles: {
                  name: `Fornecedor ${randomSupplierNumber}`,
                  company_name: `Empresa ${randomSupplierNumber} Ltda`,
                },
                timestamp: new Date().toISOString(),
                isUserBid: false,
              };

              // Adicionar novo lance ao histórico (manter até 10 lances)
              updatedBids[lotId] = [newBid, ...(updatedBids[lotId] || [])].slice(0, 10);
            }
          }
          return updatedBids;
        });
      },
      disputeMode === "random" ? 2000 : 4000
    );

    return () => clearInterval(interval);
  }, [disputeMode, lotStatuses, tiebreakerData]);

  // Função para iniciar timer de cancelamento (10 segundos)
  const startCancelTimer = (lotId: string, bidId: string) => {
    // Limpar timer anterior se existir
    if (cancelTimerRefs.current[lotId]) {
      clearTimeout(cancelTimerRefs.current[lotId]!);
    }

    // Marcar que o lance pode ser cancelado
    setRecentUserBids((prev) => ({
      ...prev,
      [lotId]: {
        bidId,
        timestamp: new Date(),
        canCancel: true,
      },
    }));

    // Timer de 10 segundos para remover a opção de cancelar
    cancelTimerRefs.current[lotId] = setTimeout(() => {
      setRecentUserBids((prev) => ({
        ...prev,
        [lotId]: {
          ...prev[lotId],
          canCancel: false,
        },
      }));
    }, 10000);
  };

  // Função para cancelar lance do usuário
  const handleCancelBid = (lotId: string, bidId: string) => {
    // Remover o lance da lista
    setLotBids((prev) => ({
      ...prev,
      [lotId]: prev[lotId]?.filter(bid => bid.id !== bidId) || [],
    }));

    // Remover do estado de lances recentes
    setRecentUserBids((prev) => {
      const newState = { ...prev };
      delete newState[lotId];
      return newState;
    });

    // Limpar timer
    if (cancelTimerRefs.current[lotId]) {
      clearTimeout(cancelTimerRefs.current[lotId]!);
    }

    toast({
      title: "Lance Cancelado",
      description: `Seu lance foi cancelado com sucesso.`,
      variant: "default",
    });
  };

  const handleSendBid = async (lotId: string) => {
    setShowConfirmDialog(null);
    setIsSubmitting((prev) => ({ ...prev, [lotId]: true }));

    const bidValue = parseCurrencyToNumber(newBidValues[lotId] || "");
    if (isNaN(bidValue) || bidValue <= 0) {
      toast({ title: "Erro", description: "Valor de lance inválido.", variant: "destructive" });
      setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
      return;
    }

    try {
      // Criar o lance imediatamente (sem countdown)
      const newBid = {
        id: `bid-${Date.now()}`,
        value: bidValue,
        is_percentage: false,
        profiles: {
          name: profile?.supplierNumber
            ? `Fornecedor ${profile.supplierNumber}`
            : profile?.name || "Seu Lance",
          company_name: profile?.company_name || "Sua Empresa",
        },
        timestamp: new Date().toISOString(),
        isUserBid: true, // Marcar como lance do usuário
      };

      // Adicionar o lance à lista
      setLotBids((prev) => ({
        ...prev,
        [lotId]: [newBid, ...(prev[lotId] || [])].slice(0, 10),
      }));

      // Limpar o campo de entrada
      setNewBidValues((prev) => ({ ...prev, [lotId]: "" }));

      // Iniciar timer de cancelamento
      startCancelTimer(lotId, newBid.id);

      // NOVA LÓGICA: Toast diferenciado para desempate
      const tiebreakerInfo = tiebreakerData[lotId];
      const isInTiebreaker = tiebreakerInfo?.isActive || false;

      toast({
        title: isInTiebreaker ? "Lance de Desempate Enviado" : "Lance Enviado",
        description: isInTiebreaker 
          ? `Seu lance de desempate de R$ ${bidValue.toFixed(2)} foi registrado! Você tem 10 segundos para cancelá-lo.`
          : `Seu lance de R$ ${bidValue.toFixed(2)} foi registrado! Você tem 10 segundos para cancelá-lo.`,
        duration: 5000,
      });

    } catch (error) {
      console.error("Erro ao enviar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o lance.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
    }
  };

  const formatValue = (value: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${value.toFixed(2).replace(".", ",")}%`;
    }
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getSuggestedBids = (lotId: string) => {
    // Agora sugerimos valores diversos, não baseados no "melhor" lance
    const baseSuggestions = [50, 75, 100, 125, 150];
    return baseSuggestions.map((value) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)
    );
  };

  const handleSuggestedBidClick = (lotId: string, value: string) => {
    setNewBidValues((prev) => ({ ...prev, [lotId]: value }));
    
    // NOVA LÓGICA: Toast diferenciado para desempate
    const tiebreakerInfo = tiebreakerData[lotId];
    const isInTiebreaker = tiebreakerInfo?.isActive || false;
    
    toast({
      title: isInTiebreaker ? "Valor Sugerido para Desempate" : "Valor Sugerido Aplicado",
      description: `Valor ${value} aplicado ao campo de lance${isInTiebreaker ? ' de desempate' : ''}.`,
    });
  };

  const getLotStatusInfo = (lotId: string) => {
    const status = lotStatuses[lotId] || "waiting";
    
    // NOVA LÓGICA: Verificar se está em desempate
    const tiebreakerInfo = tiebreakerData[lotId];
    if (tiebreakerInfo?.isActive) {
      return { 
        label: "Desempate", 
        variant: "destructive" as const, 
        icon: Shuffle 
      };
    }

    switch (status) {
      case "waiting":
        return { label: "Não iniciado", variant: "outline" as const, icon: Clock };
      case "open":
        return { label: "Em disputa", variant: "default" as const, icon: TrendingDown };
      case "tiebreaker":
        return { label: "Desempate", variant: "destructive" as const, icon: Shuffle };
      case "finished":
        return { label: "Finalizado", variant: "secondary" as const, icon: Trophy };
      default:
        return { label: "Indefinido", variant: "outline" as const, icon: Clock };
    }
  };

  // FUNÇÃO CORRIGIDA: Verificação aprimorada para permitir lances no desempate
  const canSendBid = (lotId: string) => {
    if (disputeMode === "closed") return false;
    
    // NOVA LÓGICA: Permitir lances durante desempate se o usuário estiver envolvido
    const tiebreakerInfo = tiebreakerData[lotId];
    if (tiebreakerInfo?.isActive) {
      // Verificar múltiplas variações do nome do fornecedor
      const userSupplierVariations = [
        `FORNECEDOR ${profile?.supplierNumber || 23}`,
        `Fornecedor ${profile?.supplierNumber || 23}`,
        profile?.name || "João Silva",
        profile?.company_name || "Fornecedora ABC",
        "FORNECEDOR 23", // Garantir que o usuário demo seja incluído
        "Fornecedor 23",
        "João Silva"
      ];
      
      // Verificar se alguma das variações está na lista de fornecedores em desempate
      const isInTiebreaker = tiebreakerInfo.suppliers.some(supplier => 
        userSupplierVariations.some(variation => 
          supplier.toLowerCase().includes(variation.toLowerCase()) || 
          variation.toLowerCase().includes(supplier.toLowerCase())
        )
      );
      
      console.log("🔍 Verificação de desempate:", {
        lotId,
        tiebreakerSuppliers: tiebreakerInfo.suppliers,
        userVariations: userSupplierVariations,
        isInTiebreaker,
        isSupplier,
        canSend: isSupplier && isInTiebreaker
      });
      
      return isSupplier && isInTiebreaker;
    }

    return lotStatuses[lotId] === "open" && isSupplier;
  };

  const getBestBid = (lotId: string) => {
    const bids = lotBids[lotId] || [];
    return bids.length > 0 ? bids[0] : null; // Primeiro lance é o mais recente
  };

  const getRankedBids = (lotId: string) => {
    const bids = lotBids[lotId] || [];
    // Ordenar por menor valor para classificação de posições
    return [...bids].sort((a, b) => a.value - b.value);
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

  // Função para verificar se um lance pode ser cancelado
  const canCancelBid = (lotId: string, bidId: string) => {
    const recentBid = recentUserBids[lotId];
    return recentBid && recentBid.bidId === bidId && recentBid.canCancel;
  };

  // Função para obter o tempo restante para cancelar (em segundos)
  const getCancelTimeLeft = (lotId: string) => {
    const recentBid = recentUserBids[lotId];
    if (!recentBid || !recentBid.canCancel) return 0;
    
    const elapsed = (Date.now() - recentBid.timestamp.getTime()) / 1000;
    return Math.max(0, 10 - elapsed);
  };

  // Hook para atualizar o tempo restante para cancelar
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentUserBids((prev) => {
        const newState = { ...prev };
        let hasChanges = false;

        Object.keys(newState).forEach((lotId) => {
          if (newState[lotId].canCancel) {
            const elapsed = (Date.now() - newState[lotId].timestamp.getTime()) / 1000;
            if (elapsed >= 10) {
              newState[lotId] = { ...newState[lotId], canCancel: false };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? newState : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lotes da Licitação</h2>
        <Badge variant="outline" className="text-sm">
          Modo: {getModeName(disputeMode)}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {lots.map((lot, index) => {
          const statusInfo = getLotStatusInfo(lot.id);
          const StatusIcon = statusInfo.icon;
          const bestBid = getBestBid(lot.id);
          const rankedBids = getRankedBids(lot.id);
          const isLotSubmitting = isSubmitting[lot.id];
          const isActive = activeLot?.id === lot.id;
          const suggestedBids = getSuggestedBids(lot.id);
          const lotStatus = lotStatuses[lot.id];
          const lotNumber = index + 1;

          // NOVA LÓGICA: Obter dados de desempate
          const tiebreakerInfo = tiebreakerData[lot.id];
          const isInTiebreaker = tiebreakerInfo?.isActive || false;

          // Verificar se existe lance recente do usuário que pode ser cancelado
          const userRecentBid = recentUserBids[lot.id];
          const canCancelRecentBid = userRecentBid && userRecentBid.canCancel;
          const cancelTimeLeft = Math.ceil(getCancelTimeLeft(lot.id));

          return (
            <Card
              key={lot.id}
              className={`cursor-pointer transition-all ${
                isActive ? "border-blue-500 ring-2 ring-blue-200" : "hover:border-gray-300"
              } ${isInTiebreaker ? "border-red-300 bg-red-50" : ""}`}
              onClick={() => onSelectLot(lot)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-xl">Lote {lotNumber}</h3>
                      <Badge variant={statusInfo.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      {isActive && <Badge variant="default">Lote Ativo</Badge>}
                      
                      {/* NOVO: Badge de desempate com timer */}
                      {isInTiebreaker && tiebreakerInfo && (
                        <Badge variant="destructive" className="animate-pulse">
                          <Timer className="h-3 w-3 mr-1" />
                          {formatTiebreakerTime(tiebreakerInfo.timeLeft)}
                        </Badge>
                      )}
                    </div>

                    {/* NOVA SEÇÃO: Informações de desempate */}
                    {isInTiebreaker && tiebreakerInfo && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-800 font-medium">
                            🔥 Desempate em andamento entre: {tiebreakerInfo.suppliers.join(", ")}
                          </span>
                          <span className="text-red-600 font-bold">
                            {formatTiebreakerTime(tiebreakerInfo.timeLeft)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Timer individual por lote - MODIFICADO para não mostrar durante desempate */}
                    {!isInTiebreaker && (
                      <div className="mb-3">
                        <DisputeTimerDemo
                          lotId={lot.id}
                          mode={disputeMode}
                          isActive={true}
                          onTimeEnd={handleTimerEnd}
                          onFinalize={handleFinalizeLot}
                          isAuctioneer={isAuctioneer}
                          lotStatus={lotStatus}
                          onDisputeFinalized={onDisputeFinalized}
                        />
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mb-2">{lot.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{lotParticipants[lot.id] || 0} Participantes</span>
                      </div>
                      <span>{lot.items?.length || 0} Itens</span>
                      <span>{rankedBids.length} Lances</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {bestBid && (
                      <div className="text-sm">
                        <div className="text-gray-500">Último lance</div>
                        <div className="font-semibold text-blue-600 text-lg">
                          {formatValue(bestBid.value, bestBid.is_percentage)}
                        </div>
                        <div className="text-xs text-gray-500">por {bestBid.profiles.name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Classificação atual dos lances */}
                {rankedBids.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Classificação Atual:</h4>
                    <div className="space-y-1">
                      {rankedBids.slice(0, 3).map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <Badge
                              variant={index === 0 ? "default" : "outline"}
                              className="text-xs">
                              {index + 1}º
                            </Badge>
                            <span>{bid.profiles.name}</span>
                            {bid.isUserBid && <span className="text-blue-600 font-medium">(Você)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatValue(bid.value, false)}</span>
                            {/* Botão de cancelar lance (lixeira) */}
                            {bid.isUserBid && canCancelBid(lot.id, bid.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBid(lot.id, bid.id);
                                }}
                                title={`Cancelar lance (${cancelTimeLeft}s restantes)`}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {rankedBids.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{rankedBids.length - 3} outros lances
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Aviso sobre lance recente que pode ser cancelado */}
                {canCancelRecentBid && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-800">
                        ⚠️ Você pode cancelar seu último lance
                      </span>
                      <span className="text-yellow-600 font-medium">
                        {cancelTimeLeft}s restantes
                      </span>
                    </div>
                  </div>
                )}

                {/* Controles do pregoeiro */}
                {isAuctioneer && lotStatus === "waiting" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button onClick={() => handleStartLot(lot.id)} className="w-full" size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Disputa do Lote {lotNumber}
                    </Button>
                  </div>
                )}

                {/* Campo de lance para fornecedores - MODIFICADO para desempate */}
                {canSendBid(lot.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* NOVA SEÇÃO: Aviso especial para desempate */}
                      {isInTiebreaker && (
                        <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                          <div className="text-sm text-red-800 font-medium">
                            🔥 <strong>DESEMPATE ATIVO!</strong> Você está participando da disputa de desempate.
                            <br />
                            Tempo restante: <strong>{formatTiebreakerTime(tiebreakerInfo?.timeLeft || 0)}</strong>
                          </div>
                        </div>
                      )}

                      {/* Valores Sugeridos */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Valores sugeridos:</span>
                        {suggestedBids.slice(0, 3).map((suggestedValue, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleSuggestedBidClick(lot.id, suggestedValue)}>
                            {suggestedValue}
                          </Button>
                        ))}
                      </div>

                      {/* Campo de Lance */}
                      <div className="flex items-center gap-3">
                        <Input
                          type="text"
                          placeholder="R$ 100,00"
                          value={newBidValues[lot.id] || ""}
                          onChange={(e) => handleBidInputChange(lot.id, e.target.value)}
                          disabled={isLotSubmitting}
                          className={`flex-1 text-xl text-center h-12 font-semibold ${
                            isInTiebreaker ? "border-red-300 bg-red-50 text-red-900" : "text-gray-900"
                          }`}
                          maxLength={15}
                        />
                        <Button
                          onClick={() => setShowConfirmDialog(lot.id)}
                          disabled={isLotSubmitting || !newBidValues[lot.id]?.trim()}
                          className={`text-md px-6 py-3 h-12 ${
                            isInTiebreaker ? "bg-red-600 hover:bg-red-700" : ""
                          }`}
                          size="lg">
                          {isLotSubmitting ? "Enviando..." : isInTiebreaker ? "Lance Desempate" : "Enviar Lance"}
                        </Button>
                      </div>

                      <p className="text-center text-gray-500 text-sm">
                        ⚠️ Lance será enviado imediatamente - Você terá 10 segundos para cancelar
                        {isInTiebreaker && (
                          <span className="block text-red-600 font-medium">
                            🔥 Disputando desempate com tempo limitado!
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {disputeMode === "closed" && statusInfo.label === "Em disputa" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center text-gray-600">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Modo Fechado - Aguardando abertura das propostas</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pop-up de Confirmação de Lance - MODIFICADO para desempate */}
      <Dialog
        open={!!showConfirmDialog}
        onOpenChange={(open) => setShowConfirmDialog(open ? showConfirmDialog : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {showConfirmDialog && tiebreakerData[showConfirmDialog]?.isActive 
                ? "Confirmar Lance de Desempate" 
                : "Confirmar Lance"
              }
            </DialogTitle>
            <DialogDescription className="text-lg">
              {showConfirmDialog && tiebreakerData[showConfirmDialog]?.isActive && (
                <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                  <span className="text-red-800 font-medium text-sm">
                    🔥 Este é um lance de desempate! 
                    Tempo restante: {formatTiebreakerTime(tiebreakerData[showConfirmDialog]?.timeLeft || 0)}
                  </span>
                </div>
              )}
              Você está prestes a enviar um lance de{" "}
              <span className="font-bold text-blue-600 text-xl">
                {newBidValues[showConfirmDialog || ""]}
              </span>
              {" "}para o <strong>Lote {showConfirmDialog ? getLotNumber(showConfirmDialog) : ""}</strong>
              <br />
              <br />
              <span className="text-sm text-gray-600">
                <strong>Importante:</strong> O lance será enviado imediatamente e você terá apenas 10 segundos para cancelá-lo se necessário.
                {showConfirmDialog && tiebreakerData[showConfirmDialog]?.isActive && (
                  <span className="block text-red-600 font-medium mt-1">
                    ⚠️ Este lance faz parte da disputa de desempate!
                  </span>
                )}
              </span>
              <br />
              <br />
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(null)}
              className="text-lg px-6">
              Cancelar
            </Button>
            <Button 
              onClick={() => handleSendBid(showConfirmDialog || "")} 
              className={`text-lg px-6 ${
                showConfirmDialog && tiebreakerData[showConfirmDialog]?.isActive 
                  ? "bg-red-600 hover:bg-red-700" 
                  : ""
              }`}>
              {showConfirmDialog && tiebreakerData[showConfirmDialog]?.isActive 
                ? "Confirmar Lance de Desempate" 
                : "Confirmar Lance"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}