"use client";

import { useState, useEffect, useRef } from "react";
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

interface DisputeMainContentDemoProps {
  tenderId: string;
  activeLot: any | null;
  disputeStatus: string;
  disputeMode: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  userId: string;
  profile: any | null;
}

// Dados mocados para demonstração
const mockBestBid = {
  id: "bid-demo-001",
  value: 7.95,
  is_percentage: false,
  profiles: {
    name: "Fornecedora ABC",
    company_name: "ABC Materiais Ltda",
  },
};

export function DisputeMainContentDemo({
  tenderId,
  activeLot,
  disputeStatus,
  disputeMode,
  isAuctioneer,
  isSupplier,
  userId,
  profile,
}: DisputeMainContentDemoProps) {
  const [newBidValue, setNewBidValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bestBid, setBestBid] = useState<any>(mockBestBid);
  const [lotParticipants, setLotParticipants] = useState(3); // Número fixo para demo
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Simular mudanças no melhor lance
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% de chance a cada 3 segundos
        const newValue = bestBid.value - (Math.random() * 0.1 + 0.01);
        setBestBid((prev: any) => ({
          ...prev,
          value: Number(newValue.toFixed(2)),
          profiles: {
            name: Math.random() > 0.5 ? "Fornecedora XYZ" : "Fornecedora 123",
            company_name: Math.random() > 0.5 ? "XYZ Suprimentos Ltda" : "123 Materiais Ltda",
          },
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bestBid.value]);

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

    // Simular envio do lance (sem banco de dados)
    setNewBidValue("");
    startCountdown();
    toast({ title: "Lance enviado", description: "Aguardando confirmação do lance..." });
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
      // Simular efetivação do lance
      const bidValue = Number.parseFloat(newBidValue.replace(",", "."));
      setBestBid({
        id: `bid-${Date.now()}`,
        value: bidValue,
        is_percentage: false,
        profiles: {
          name: profile?.name || "Seu Lance",
          company_name: profile?.company_name || "Sua Empresa",
        },
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
    if (!bestBid) return "7,50";
    const suggested = bestBid.value - 0.05;
    return suggested.toFixed(2).replace(".", ",");
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
              <h2 className="text-3xl font-bold text-gray-900">LOTE {activeLot.number}</h2>
              <p className="text-lg text-gray-600">{activeLot.title}</p>
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
        {disputeStatus === "active" && isSupplier && (
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enviar Lance</h3>
              <p className="text-lg text-gray-600">
                Melhor lance atual:{" "}
                {bestBid ? formatValue(bestBid.value, bestBid.is_percentage) : "N/A"}
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
                  Sugestão: R$ {getSuggestedBid()} (R$ 0,05 melhor que o atual)
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

        {!isSupplier && disputeStatus === "active" && (
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
              <span className="font-bold text-blue-600 text-xl">R$ {newBidValue}</span>
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
