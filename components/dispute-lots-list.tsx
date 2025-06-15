"use client";

import { useState, useEffect, useRef } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingDown, Clock, AlertCircle, Users, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DisputeLotsListProps {
  lots: any[];
  activeLot: string | null;
  disputeStatus: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  userId: string;
  profile: any | null;
  onSelectLot: (lot: any) => void;
}

export function DisputeLotsList({
  lots,
  activeLot,
  disputeStatus,
  isAuctioneer,
  isSupplier,
  userId,
  profile,
  onSelectLot,
}: DisputeLotsListProps) {
  const [lotStatuses, setLotStatuses] = useState<Record<string, any>>({});
  const [bestBids, setBestBids] = useState<Record<string, any>>({});
  const [newBidValues, setNewBidValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState<Record<string, number | null>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const countdownRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    const loadLotData = async () => {
      try {
        const { data: disputeLots } = await supabase
          .from("tender_lot_disputes")
          .select("*")
          .eq("tender_id", lots[0]?.tender_id);
        const statusMap: Record<string, any> = {};
        disputeLots?.forEach((item) => {
          statusMap[item.lot_id] = item;
        });
        setLotStatuses(statusMap);

        // Fetch best bids for all lots
        const { data: bidsData, error: bidsError } = await supabase
          .from("tender_bids")
          .select(
            `
            *,
            profiles:user_id(name, email)
          `
          )
          .in(
            "lot_id",
            lots.map((lot) => lot.id)
          )
          .eq("status", "active")
          .order("value", { ascending: true });

        if (bidsError) throw bidsError;

        const bestBidsMap: Record<string, any> = {};
        bidsData?.forEach((bid) => {
          if (!bestBidsMap[bid.lot_id] || bid.value < bestBidsMap[bid.lot_id].value) {
            bestBidsMap[bid.lot_id] = bid;
          }
        });
        setBestBids(bestBidsMap);
      } catch (error) {
        console.error("Erro ao carregar dados dos lotes:", error);
      }
    };

    if (lots.length > 0) {
      loadLotData();

      const subscription = supabase
        .channel("lot_data_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tender_lot_disputes",
            filter: `tender_id=eq.${lots[0]?.tender_id}`,
          },
          () => {
            loadLotData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tender_bids",
            filter: `tender_id=eq.${lots[0]?.tender_id}`,
          },
          () => {
            loadLotData(); // Recarrega os melhores lances
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [lots, supabase]);

  const getLotStatusInfo = (lotId: string) => {
    const status = lotStatuses[lotId]?.status || "waiting";
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const startCountdown = (lotId: string) => {
    setCountdown((prev) => ({ ...prev, [lotId]: 10 }));
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

    try {
      const { error } = await supabase.from("tender_bids").insert({
        tender_id: lots[0]?.tender_id, // Assumindo que todos os lotes são do mesmo tender
        lot_id: lotId,
        user_id: userId,
        value: bidValue,
        is_percentage: false, // Ajuste conforme a necessidade (percentual ou valor fixo)
        status: "pending",
      });

      if (error) throw error;

      setNewBidValues((prev) => ({ ...prev, [lotId]: "" }));
      startCountdown(lotId);
      toast({ title: "Lance enviado", description: "Aguardando confirmação do lance..." });
    } catch (error) {
      console.error("Erro ao enviar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o lance.",
        variant: "destructive",
      });
      setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
    }
  };

  const handleCancelBid = (lotId: string) => {
    if (countdownRefs.current[lotId]) {
      clearInterval(countdownRefs.current[lotId]!);
    }
    setCountdown((prev) => ({ ...prev, [lotId]: null }));
    setIsSubmitting((prev) => ({ ...prev, [lotId]: false }));
    toast({ title: "Lance cancelado", description: "Seu lance foi cancelado." });
  };

  const handleEffectiveBid = async (lotId: string) => {
    try {
      const { error } = await supabase
        .from("tender_bids")
        .update({ status: "active" })
        .eq("tender_id", lots[0]?.tender_id)
        .eq("lot_id", lotId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const bidValue = newBidValues[lotId] || "N/A";
      await supabase.from("dispute_messages").insert({
        tender_id: lots[0]?.tender_id,
        lot_id: lotId,
        user_id: userId,
        content: `Novo lance registrado para o Lote ${
          lots.find((l) => l.id === lotId)?.name || ""
        }: R$ ${bidValue}`,
        type: "system",
        is_private: false,
      });

      toast({ title: "Lance efetivado", description: "Seu lance foi registrado com sucesso." });
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

  const getSuggestedBid = (lotId: string) => {
    const currentBest = bestBids[lotId]?.value;
    if (!currentBest) return "0,00"; // Valor inicial se não houver lance
    const suggested = currentBest - 0.01; // Sugere 0,01 a menos
    return suggested.toFixed(2).replace(".", ",");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Lotes da Licitação</h2>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {lots.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            Nenhum lote disponível para disputa.
          </div>
        ) : (
          lots.map((lot) => {
            const statusInfo = getLotStatusInfo(lot.id);
            const StatusIcon = statusInfo.icon;
            const bestBidForLot = bestBids[lot.id];
            const currentCountdown = countdown[lot.id];
            const isLotSubmitting = isSubmitting[lot.id];
            const isActive = activeLot === lot.id;

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
                          <span>{lot.proposals?.length || 0} Participantes</span>{" "}
                          {/* Usar proposals.length para participantes */}
                        </div>
                        <span>{lot.items?.length || 0} Itens</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {bestBidForLot && (
                        <div className="text-sm">
                          <div className="text-gray-500">Melhor valor</div>
                          <div className="font-semibold text-green-600 text-lg">
                            {formatCurrency(bestBidForLot.value)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSupplier && statusInfo.label === "Em disputa" && (
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
                          <div className="flex items-center gap-3">
                            <Input
                              type="text"
                              placeholder={`R$ ${getSuggestedBid(lot.id)}`}
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
                            Sugestão: R$ {getSuggestedBid(lot.id)} (R$ 0,01 melhor que o atual)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pop-up de Confirmação de Lance */}
      <Dialog
        open={!!showConfirmDialog}
        onOpenChange={(open) => setShowConfirmDialog(open ? showConfirmDialog : null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Lance</DialogTitle>
            <DialogDescription className="text-lg">
              Você está prestes a enviar um lance de{" "}
              <span className="font-bold text-blue-600 text-xl">
                R$ {newBidValues[showConfirmDialog || ""]}
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
