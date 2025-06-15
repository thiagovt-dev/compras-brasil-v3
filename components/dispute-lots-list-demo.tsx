"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, Timer, AlertCircle, CheckCircle, Clock, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
}

// Dados mocados para demonstração
const mockLotBids: Record<
  string,
  { value: number; is_percentage: boolean; profiles: { name: string; company_name: string } }
> = {
  "lot-001": {
    value: 8.2,
    is_percentage: false,
    profiles: { name: "Fornecedor 15", company_name: "Empresa 15 Ltda" },
  },
  "lot-002": {
    value: 120.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 8", company_name: "Empresa 8 Ltda" },
  },
  "lot-003": {
    value: 50.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 22", company_name: "Empresa 22 Ltda" },
  },
  "lot-004": {
    value: 25.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 11", company_name: "Empresa 11 Ltda" },
  },
  "lot-005": {
    value: 15.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 7", company_name: "Empresa 7 Ltda" },
  },
  "lot-006": {
    value: 30.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 19", company_name: "Empresa 19 Ltda" },
  },
  "lot-007": {
    value: 40.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 3", company_name: "Empresa 3 Ltda" },
  },
  "lot-008": {
    value: 10.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 14", company_name: "Empresa 14 Ltda" },
  },
  "lot-009": {
    value: 5.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 25", company_name: "Empresa 25 Ltda" },
  },
  "lot-010": {
    value: 20.0,
    is_percentage: false,
    profiles: { name: "Fornecedor 9", company_name: "Empresa 9 Ltda" },
  },
};

const mockLotStatuses: Record<string, string> = {
  "lot-001": "open",
  "lot-002": "waiting",
  "lot-003": "open",
  "lot-004": "negotiation",
  "lot-005": "closed",
  "lot-006": "open",
  "lot-007": "waiting",
  "lot-008": "open",
  "lot-009": "negotiation",
  "lot-010": "closed",
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
}: DisputeLotsListDemoProps) {
  const [newBidValues, setNewBidValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState<Record<string, number | null>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [bestBids, setBestBids] = useState<Record<string, any>>(mockLotBids);
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
  const countdownRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const { toast } = useToast();

  // Simular mudanças no melhor lance baseado no modo de disputa
  useEffect(() => {
    console.log("DisputeLotsListDemo: disputeMode changed to", disputeMode);
    if (disputeMode === "closed") return; // Modo fechado não tem lances em tempo real

    const interval = setInterval(
      () => {
        setBestBids((prevBids) => {
          const updatedBids = { ...prevBids };
          for (const lotId in updatedBids) {
            if (mockLotStatuses[lotId] === "open" && Math.random() < 0.15) {
              const currentValue = updatedBids[lotId].value;
              const reduction =
                disputeMode === "random" ? Math.random() * 0.2 + 0.05 : Math.random() * 0.1 + 0.01;
              const newValue = currentValue - reduction;
              const randomSupplierNumber = Math.floor(Math.random() * 30) + 1;

              updatedBids[lotId] = {
                ...updatedBids[lotId],
                value: Number(newValue.toFixed(2)),
                profiles: {
                  name: `Fornecedor ${randomSupplierNumber}`,
                  company_name: `Empresa ${randomSupplierNumber} Ltda`,
                },
              };
            }
          }
          return updatedBids;
        });
      },
      disputeMode === "random" ? 2000 : 4000
    ); // Mais frequente no modo randômico

    return () => clearInterval(interval);
  }, [disputeMode]);

  const startCountdown = (lotId: string) => {
    const countdownTime = disputeMode === "random" ? 5 : 10; // Countdown mais rápido no modo randômico
    setCountdown((prev) => ({ ...prev, [lotId]: countdownTime }));

    if (countdownRefs.current[lotId]) {
      clearInterval(countdownRefs.current[lotId]!);
    }

    countdownRefs.current[lotId] = setInterval(() => {
      setCountdown((prev) => {
        const current = prev[lotId];
        if (current === null || current <= 1) {
          clearInterval(countdownRefs.current[lotId]!);
          handleEffectiveBid(lotId);
          return { ...prev, [lotId]: null };
        }
        return { ...prev, [lotId]: current - 1 };
      });
    }, 1000);
  };

  const handleSendBid = async (lotId: string) => {
    setShowConfirmDialog(null);
    setIsSubmitting((prev) => ({ ...prev, [lotId]: true }));

    const bidValue = Number.parseFloat(newBidValues[lotId]?.replace(",", ".") || "");
    if (isNaN(bidValue)) {
      toast({ title: "Erro", description: "Valor de lance inválido.", variant: "destructive" });
      setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
      return;
    }

    const currentBest = bestBids[lotId]?.value || 0;
    if (bidValue >= currentBest) {
      toast({
        title: "Lance Inválido",
        description: "Seu lance deve ser menor que o melhor lance atual.",
        variant: "destructive",
      });
      setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
      return;
    }

    setNewBidValues((prev) => ({ ...prev, [lotId]: "" }));
    startCountdown(lotId);
    toast({ title: "Lance enviado", description: "Aguardando confirmação do lance..." });
  };

  const handleCancelBid = (lotId: string) => {
    if (countdownRefs.current[lotId]) {
      clearInterval(countdownRefs.current[lotId]!);
    }
    setCountdown((prev) => ({ ...prev, [lotId]: null }));
    setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
    toast({ title: "Lance cancelado", description: "Seu lance foi cancelado." });
  };

  const handleEffectiveBid = (lotId: string) => {
    try {
      const bidValue = Number.parseFloat(newBidValues[lotId]?.replace(",", ".") || "");
      setBestBids((prev) => ({
        ...prev,
        [lotId]: {
          id: `bid-${Date.now()}`,
          value: bidValue,
          is_percentage: false,
          profiles: {
            name: profile?.supplierNumber
              ? `Fornecedor ${profile.supplierNumber}`
              : profile?.name || "Seu Lance",
            company_name: profile?.company_name || "Sua Empresa",
          },
        },
      }));

      toast({
        title: "Lance efetivado",
        description: `Seu lance de R$ ${bidValue.toFixed(2)} foi registrado com sucesso!`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Erro ao efetivar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível efetivar o lance.",
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
    const currentBest = bestBids[lotId]?.value;
    if (!currentBest) return ["7,50", "7,00", "6,50"];

    const suggestions = [
      (currentBest - 0.05).toFixed(2),
      (currentBest - 0.1).toFixed(2),
      (currentBest - 0.2).toFixed(2),
    ];

    return suggestions.map((s) => s.replace(".", ","));
  };

  const handleSuggestedBidClick = (lotId: string, value: string) => {
    setNewBidValues((prev) => ({ ...prev, [lotId]: value }));
    toast({
      title: "Valor Sugerido Aplicado",
      description: `Valor R$ ${value} aplicado ao campo de lance.`,
    });
  };

  const getLotStatusInfo = (lotId: string) => {
    const status = mockLotStatuses[lotId] || "waiting";
    switch (status) {
      case "waiting":
        return { label: "Não iniciado", variant: "outline" as const, icon: Clock };
      case "open":
        return { label: "Em disputa", variant: "default" as const, icon: TrendingDown };
      case "negotiation":
        return { label: "Negociação finalizada", variant: "secondary" as const, icon: CheckCircle };
      case "closed":
        return { label: "Encerrado", variant: "destructive" as const, icon: AlertCircle };
      default:
        return { label: "Indefinido", variant: "outline" as const, icon: Clock };
    }
  };

  const canSendBid = (lotId: string) => {
    if (disputeMode === "closed") return false;
    return mockLotStatuses[lotId] === "open" && isSupplier;
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

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lotes da Licitação</h2>
        <Badge variant="outline" className="text-sm">
          Modo: {getModeName(disputeMode)}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {lots.map((lot) => {
          const statusInfo = getLotStatusInfo(lot.id);
          const StatusIcon = statusInfo.icon;
          const bestBidForLot = bestBids[lot.id];
          const currentCountdown = countdown[lot.id];
          const isLotSubmitting = isSubmitting[lot.id];
          const isActive = activeLot?.id === lot.id;
          const suggestedBids = getSuggestedBids(lot.id);

          return (
            <Card
              key={lot.id}
              className={`cursor-pointer transition-all ${
                isActive ? "border-blue-500 ring-2 ring-blue-200" : "hover:border-gray-300"
              }`}
              onClick={() => onSelectLot(lot)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-xl">{lot.name}</h3>
                      <Badge variant={statusInfo.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      {isActive && <Badge variant="default">Lote Ativo</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{lot.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{lotParticipants[lot.id] || 0} Participantes</span>
                      </div>
                      <span>{lot.items?.length || 0} Itens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {bestBidForLot && (
                      <div className="text-sm">
                        <div className="text-gray-500">Melhor valor</div>
                        <div className="font-semibold text-green-600 text-lg">
                          {formatValue(bestBidForLot.value, bestBidForLot.is_percentage)}
                        </div>
                        <div className="text-xs text-gray-500">
                          por {bestBidForLot.profiles.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {canSendBid(lot.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {currentCountdown !== null ? (
                      <div className="text-center">
                        <div className="mb-4">
                          <Timer className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-blue-600 mb-1">
                            {currentCountdown}s
                          </p>
                          <p className="text-md text-gray-600">Confirmando seu lance...</p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelBid(lot.id)}
                          className="text-md px-6 py-2"
                          size="lg">
                          Cancelar Lance
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Valores Sugeridos */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Valores sugeridos:</span>
                          {suggestedBids.map((suggestedValue, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleSuggestedBidClick(lot.id, suggestedValue)}>
                              R$ {suggestedValue}
                            </Button>
                          ))}
                        </div>

                        {/* Campo de Lance */}
                        <div className="flex items-center gap-3">
                          <Input
                            type="text"
                            placeholder={`R$ ${suggestedBids[0]}`}
                            value={newBidValues[lot.id] || ""}
                            onChange={(e) =>
                              setNewBidValues((prev) => ({ ...prev, [lot.id]: e.target.value }))
                            }
                            disabled={isLotSubmitting}
                            className="flex-1 text-xl text-center h-12 text-gray-900 font-semibold"
                          />
                          <Button
                            onClick={() => setShowConfirmDialog(lot.id)}
                            disabled={isLotSubmitting || !newBidValues[lot.id]?.trim()}
                            className="text-md px-6 py-3 h-12"
                            size="lg">
                            Enviar Lance
                          </Button>
                        </div>

                        <p className="text-center text-gray-500 text-sm">
                          Melhor atual: {formatValue(bestBidForLot?.value || 0, false)} • Mínimo: R${" "}
                          {(bestBidForLot?.value - 0.01 || 0).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    )}
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

      {/* Pop-up de Confirmação de Lance */}
      <Dialog
        open={!!showConfirmDialog}
        onOpenChange={(open) => setShowConfirmDialog(open ? showConfirmDialog : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Lance</DialogTitle>
            <DialogDescription className="text-lg">
              Você está prestes a enviar um lance de{" "}
              <span className="font-bold text-blue-600 text-xl">
                R$ {newBidValues[showConfirmDialog || ""]}
              </span>
              <br />
              <br />
              <span className="text-sm text-gray-600">
                Modo de disputa:{" "}
                <strong>
                  {disputeMode === "open"
                    ? "Aberto"
                    : disputeMode === "random"
                    ? "Randômico"
                    : "Combinado"}
                </strong>
              </span>
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
            <Button onClick={() => handleSendBid(showConfirmDialog || "")} className="text-lg px-6">
              Confirmar Lance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
