"use client";

import { useState, useEffect, useRef } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Package, Users, TrendingDown } from "lucide-react";

interface DisputeMainContentProps {
  tenderId: string;
  activeLot: any | null;
  disputeStatus: string;
  disputeMode: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  userId: string;
  profile: any | null; // Declare the profile variable
}

export function DisputeMainContent({
  tenderId,
  activeLot,
  disputeStatus,
  disputeMode,
  isAuctioneer,
  isSupplier,
  userId,
  profile, // Use the profile variable
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

    // Logic for percentage vs R$ based on tender.judgment_criteria
    // For now, assuming percentage as per image
    const isPercentage = true; // Based on image, assuming percentage input

    try {
      const { error } = await supabase.from("tender_bids").insert({
        tender_id: tenderId,
        lot_id: activeLot.id,
        user_id: userId,
        value: bidValue,
        is_percentage: isPercentage,
        status: "pending", // Mark as pending until 10s countdown
      });

      if (error) throw error;

      setNewBidValue("");
      startCountdown(); // Start 10s countdown
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
    // Optionally, remove the pending bid from DB or mark as cancelled
    toast({ title: "Lance cancelado", description: "Seu lance foi cancelado." });
  };

  const handleEffectiveBid = async () => {
    // Logic to mark the pending bid as active in the database
    // This would involve updating the status of the last pending bid by this user for this lot
    try {
      const { error } = await supabase
        .from("tender_bids")
        .update({ status: "active" })
        .eq("tender_id", tenderId)
        .eq("lot_id", activeLot.id)
        .eq("user_id", userId)
        .eq("status", "pending") // Only update pending bids
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      // Send system message about the new bid
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
    if (!bestBid) return "-0,01%"; // Default small bid
    // Example: 0.01% better than current best
    const suggested = bestBid.value - 0.01;
    return `${suggested.toFixed(2).replace(".", ",")}%`;
  };

  if (!activeLot) {
    return (
      <Card className="h-[600px] flex items-center justify-center text-muted-foreground">
        {isAuctioneer
          ? "Selecione um lote para iniciar a disputa."
          : "Aguardando o pregoeiro selecionar um lote."}
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          LOTE {activeLot.name}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{lotParticipants} Participantes</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />
            <span>
              Melhor valor: {bestBid ? formatValue(bestBid.value, bestBid.is_percentage) : "N/A"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col justify-center items-center">
        {disputeStatus === "open" && isSupplier && (
          <div className="w-full max-w-md space-y-4">
            <div className="text-center text-lg font-semibold">
              Seu valor:{" "}
              {profile && profile.current_bid_value
                ? formatValue(profile.current_bid_value, true)
                : "N/A"}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={getSuggestedBid()}
                value={newBidValue}
                onChange={(e) => setNewBidValue(e.target.value)}
                disabled={isSubmitting || countdown !== null}
                className="flex-1 text-lg text-center"
              />
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSubmitting || countdown !== null}>
                Enviar
              </Button>
            </div>

            {countdown !== null && (
              <div className="text-center mt-4">
                <p className="text-xl font-bold text-blue-600">Contagem regressiva: {countdown}s</p>
                <Button variant="destructive" onClick={handleCancelBid} className="mt-2">
                  Cancelar Lance
                </Button>
              </div>
            )}
          </div>
        )}

        {disputeStatus === "closed" && (
          <div className="text-center text-2xl font-bold text-green-600">
            Disputa Encerrada para este lote!
          </div>
        )}

        {disputeStatus === "waiting" && (
          <div className="text-center text-xl font-medium text-gray-500">
            Aguardando início da disputa...
          </div>
        )}
      </CardContent>

      {/* Pop-up de Confirmação de Lance */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Lance</DialogTitle>
            <DialogDescription>
              Você está prestes a enviar um lance de{" "}
              <span className="font-bold">{newBidValue}%</span>. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendBid}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
