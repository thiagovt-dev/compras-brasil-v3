"use client";

import { useState, useEffect, useRef } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Users, TrendingDown, Timer, AlertCircle } from "lucide-react";

interface DisputeMainContentProps {
  tenderId: string;
  activeLot: any | null;
  disputeStatus: string;
  disputeMode: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  userId: string;
  profile: any | null;
}

export function DisputeMainContent({
  tenderId,
  activeLot,
  disputeStatus,
  disputeMode,
  isAuctioneer,
  isSupplier,
  userId,
  profile,
}: DisputeMainContentProps) {
  const [newBidValue, setNewBidValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bestBid, setBestBid] = useState<any>(null);
  const [lotParticipants, setLotParticipants] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeLot) return;

    const fetchLotData = async () => {
      try {
        const { data: bidsData, error: bidsError } = await supabase
          .from("tender_bids")
          .select(
            `
            *,
            profiles:user_id(name, email)
          `
          )
          .eq("lot_id", activeLot.id)
          .eq("status", "active")
          .order("value", { ascending: true })
          .limit(1);

        if (bidsError) throw bidsError;
        setBestBid(bidsData && bidsData.length > 0 ? bidsData[0] : null);

        const { count: participantsCount, error: participantsError } = await supabase
          .from("tender_proposals")
          .select("id", { count: "exact" })
          .eq("tender_id", tenderId)
          .eq("tender_lot_id", activeLot.id);

        if (participantsError) throw participantsError;
        setLotParticipants(participantsCount || 0);
      } catch (error) {
        console.error("Erro ao carregar dados do lote ativo:", error);
      }
    };

    fetchLotData();

    const bidsSubscription = supabase
      .channel(`lot_${activeLot.id}_bids`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_bids",
          filter: `lot_id=eq.${activeLot.id}`,
        },
        () => {
          fetchLotData();
        }
      )
      .subscribe();

    return () => {
      bidsSubscription.unsubscribe();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [activeLot, tenderId, supabase]);

  const startCountdown = () => {
    setCountdown(10);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          handleEffectiveBid();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendBid = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const bidValue = Number.parseFloat(newBidValue.replace(",", "."));
    if (isNaN(bidValue)) {
      toast({ title: "Erro", description: "Valor de lance inválido.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const isPercentage = true;

    try {
      const { error } = await supabase.from("tender_bids").insert({
        tender_id: tenderId,
        lot_id: activeLot.id,
        user_id: userId,
        value: bidValue,
        is_percentage: isPercentage,
        status: "pending",
      });

      if (error) throw error;

      setNewBidValue("");
      startCountdown();
      toast({ title: "Lance enviado", description: "Aguardando confirmação do lance..." });
    } catch (error) {
      console.error("Erro ao enviar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o lance.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleCancelBid = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdown(null);
    setIsSubmitting(false);
    toast({ title: "Lance cancelado", description: "Seu lance foi cancelado." });
  };

  const handleEffectiveBid = async () => {
    try {
      const { error } = await supabase
        .from("tender_bids")
        .update({ status: "active" })
        .eq("tender_id", tenderId)
        .eq("lot_id", activeLot.id)
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: activeLot.id,
        user_id: userId,
        content: `Novo lance registrado: ${newBidValue}%`,
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
      setIsSubmitting(false);
    }
  };

  const formatValue = (value: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${value.toFixed(2).replace(".", ",")}%`;
    }
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getSuggestedBid = () => {
    if (!bestBid) return "-0,01%";
    const suggested = bestBid.value - 0.01;
    return `${suggested.toFixed(2).replace(".", ",")}%`;
  };

  if (!activeLot) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <AlertCircle className="h-24 w-24 text-gray-400 mb-6" />
        <h2 className="text-3xl font-bold text-gray-600 mb-4">Nenhum lote selecionado</h2>
        <p className="text-xl text-gray-500 text-center max-w-md">
          {isAuctioneer
            ? "Selecione um lote para iniciar a disputa."
            : "Aguardando o pregoeiro selecionar um lote."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header do Lote */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">LOTE {activeLot.name}</h2>
              <p className="text-lg text-gray-600">{activeLot.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-6 w-6" />
              <span className="font-semibold">{lotParticipants} Participantes</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingDown className="h-6 w-6" />
              <span className="font-semibold">
                Melhor: {bestBid ? formatValue(bestBid.value, bestBid.is_percentage) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex items-center justify-center p-8">
        {disputeStatus === "open" && isSupplier && (
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enviar Lance</h3>
              <p className="text-lg text-gray-600">
                Seu valor atual:{" "}
                {profile?.current_bid_value ? formatValue(profile.current_bid_value, true) : "N/A"}
              </p>
            </div>

            {countdown !== null ? (
              <div className="text-center">
                <div className="mb-6">
                  <Timer className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-4xl font-bold text-blue-600 mb-2">{countdown}s</p>
                  <p className="text-xl text-gray-600">Confirmando seu lance...</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleCancelBid}
                  className="text-lg px-8 py-3"
                  size="lg">
                  Cancelar Lance
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Input
                    type="text"
                    placeholder={getSuggestedBid()}
                    value={newBidValue}
                    onChange={(e) => setNewBidValue(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 text-2xl text-center h-16 text-gray-900 font-semibold"
                  />
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isSubmitting || !newBidValue.trim()}
                    className="text-xl px-8 py-4 h-16"
                    size="lg">
                    Enviar Lance
                  </Button>
                </div>
                <p className="text-center text-gray-500">
                  Sugestão: {getSuggestedBid()} (0,01% melhor que o atual)
                </p>
              </div>
            )}
          </div>
        )}

        {disputeStatus === "closed" && (
          <div className="text-center">
            <div className="bg-green-100 rounded-xl p-8">
              <h3 className="text-4xl font-bold text-green-600 mb-4">Disputa Encerrada</h3>
              <p className="text-xl text-green-700">Este lote foi finalizado</p>
            </div>
          </div>
        )}

        {disputeStatus === "waiting" && (
          <div className="text-center">
            <div className="bg-yellow-100 rounded-xl p-8">
              <h3 className="text-4xl font-bold text-yellow-600 mb-4">Aguardando Início</h3>
              <p className="text-xl text-yellow-700">A disputa ainda não foi iniciada</p>
            </div>
          </div>
        )}

        {!isSupplier && disputeStatus === "open" && (
          <div className="text-center">
            <div className="bg-blue-100 rounded-xl p-8">
              <h3 className="text-3xl font-bold text-blue-600 mb-4">Disputa em Andamento</h3>
              <p className="text-xl text-blue-700">
                {isAuctioneer
                  ? "Você está gerenciando esta disputa"
                  : "Acompanhando como observador"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up de Confirmação de Lance */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Lance</DialogTitle>
            <DialogDescription className="text-lg">
              Você está prestes a enviar um lance de{" "}
              <span className="font-bold text-blue-600 text-xl">{newBidValue}%</span>
              <br />
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="text-lg px-6">
              Cancelar
            </Button>
            <Button onClick={handleSendBid} className="text-lg px-6">
              Confirmar Lance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
