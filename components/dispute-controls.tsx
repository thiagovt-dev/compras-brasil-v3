"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, MessageSquare, CheckCircle, Settings, ArrowLeft } from "lucide-react";

interface DisputeControlsProps {
  tenderId: string;
  status: string;
  activeLot: any | null;
  lots: any[];
  userId: string;
}

export function DisputeControls({
  tenderId,
  status,
  activeLot,
  lots,
  userId,
}: DisputeControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<string>(activeLot?.id || "");
  const [openLotDialog, setOpenLotDialog] = useState(false);
  const [disputeMode, setDisputeMode] = useState<string>("open_closed");
  const [disputeTime, setDisputeTime] = useState<number>(15);

  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  const updateDisputeStatus = async (newStatus: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tender_disputes")
        .update({ status: newStatus })
        .eq("tender_id", tenderId);

      if (error) throw error;

      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: activeLot?.id || null,
        user_id: userId,
        content: getStatusMessage(newStatus),
        type: "system",
        is_private: false,
      });

      toast({
        title: "Status atualizado",
        description: `Status da disputa atualizado para ${getStatusLabel(newStatus)}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status da disputa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da disputa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startDispute = async () => {
    if (!selectedLotId) return;

    setIsLoading(true);

    try {
      const { error: disputeError } = await supabase
        .from("tender_disputes")
        .update({
          status: "open",
          active_lot_id: selectedLotId,
          dispute_mode: disputeMode,
        })
        .eq("tender_id", tenderId);

      if (disputeError) throw disputeError;

      const { error: lotError } = await supabase.from("tender_lot_disputes").upsert({
        tender_id: tenderId,
        lot_id: selectedLotId,
        status: "open",
        dispute_mode: disputeMode,
        time_limit: disputeTime,
        random_end_time:
          disputeMode === "random"
            ? new Date(Date.now() + Math.random() * 30 * 60 * 1000).toISOString()
            : null,
      });

      if (lotError) throw lotError;

      const selectedLotData = lots.find((lot) => lot.id === selectedLotId);

      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: selectedLotId,
        user_id: userId,
        content: `Disputa iniciada para o lote "${
          selectedLotData?.name
        }". Modo: ${getDisputeModeLabel(disputeMode)}.`,
        type: "system",
        is_private: false,
      });

      if (disputeMode === "random") {
        await supabase.from("dispute_messages").insert({
          tender_id: tenderId,
          lot_id: selectedLotId,
          user_id: userId,
          content: `Tempo randômico iniciado para o lote "${selectedLotData?.name}".`,
          type: "system",
          is_private: false,
        });
      }

      toast({
        title: "Disputa iniciada",
        description: `Disputa iniciada para o lote "${selectedLotData?.name}".`,
      });

      setOpenLotDialog(false);
    } catch (error) {
      console.error("Erro ao iniciar disputa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a disputa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectLot = async () => {
    if (!selectedLotId) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("tender_disputes")
        .update({ active_lot_id: selectedLotId })
        .eq("tender_id", tenderId);

      if (error) throw error;

      const selectedLotData = lots.find((lot) => lot.id === selectedLotId);

      toast({
        title: "Lote selecionado",
        description: `Lote "${selectedLotData?.name}" selecionado para disputa.`,
      });

      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: selectedLotId,
        user_id: userId,
        content: `Lote "${selectedLotData?.name}" selecionado para disputa.`,
        type: "system",
        is_private: false,
      });

      setOpenLotDialog(false);
    } catch (error) {
      console.error("Erro ao selecionar lote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o lote para disputa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (statusCode: string) => {
    switch (statusCode) {
      case "waiting":
        return "Aguardando Início";
      case "open":
        return "Disputa Aberta";
      case "negotiation":
        return "Em Negociação";
      case "closed":
        return "Encerrada";
      default:
        return statusCode;
    }
  };

  const getStatusMessage = (statusCode: string) => {
    switch (statusCode) {
      case "waiting":
        return "Disputa retornada para aguardando início.";
      case "open":
        return "Disputa aberta para lances.";
      case "negotiation":
        return "Iniciada fase de negociação.";
      case "closed":
        return "Disputa encerrada.";
      default:
        return `Status alterado para ${statusCode}.`;
    }
  };

  const getDisputeModeLabel = (mode: string) => {
    switch (mode) {
      case "open":
        return "Aberto";
      case "closed":
        return "Fechado";
      case "open_closed":
        return "Aberto e Fechado";
      case "closed_open":
        return "Fechado e Aberto";
      case "random":
        return "Randômico";
      default:
        return mode;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {status === "waiting" && (
          <Dialog open={openLotDialog} onOpenChange={setOpenLotDialog}>
            <DialogTrigger asChild>
              <Button disabled={isLoading} size="lg" className="text-lg px-6">
                <Play className="mr-2 h-5 w-5" />
                Iniciar Disputa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Iniciar Disputa</DialogTitle>
                <DialogDescription className="text-base">
                  Configure os parâmetros da disputa antes de iniciar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lot-select" className="text-base">
                    Selecionar Lote
                  </Label>
                  <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione um lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dispute-mode" className="text-base">
                    Modo de Disputa
                  </Label>
                  <Select value={disputeMode} onValueChange={setDisputeMode}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                      <SelectItem value="open_closed">Aberto e Fechado</SelectItem>
                      <SelectItem value="closed_open">Fechado e Aberto</SelectItem>
                      <SelectItem value="random">Randômico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {disputeMode !== "random" && (
                  <div>
                    <Label htmlFor="dispute-time" className="text-base">
                      Tempo Inicial (minutos)
                    </Label>
                    <Input
                      id="dispute-time"
                      type="number"
                      min="1"
                      max="60"
                      value={disputeTime}
                      onChange={(e) => setDisputeTime(Number.parseInt(e.target.value))}
                      className="h-12"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenLotDialog(false)}
                  className="text-base px-6">
                  Cancelar
                </Button>
                <Button
                  onClick={startDispute}
                  disabled={!selectedLotId || isLoading}
                  className="text-base px-6">
                  Iniciar Disputa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {status === "open" && (
          <>
            <Button
              variant="default"
              onClick={() => updateDisputeStatus("negotiation")}
              disabled={isLoading}
              size="lg"
              className="text-lg px-6">
              <MessageSquare className="mr-2 h-5 w-5" />
              Iniciar Negociação
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading} size="lg" className="text-lg px-6">
                  <Settings className="mr-2 h-5 w-5" />
                  Trocar Lote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-xl">Selecionar Novo Lote</DialogTitle>
                  <DialogDescription className="text-base">
                    Escolha outro lote para continuar a disputa.
                  </DialogDescription>
                </DialogHeader>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione um lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpenLotDialog(false)}
                    className="text-base px-6">
                    Cancelar
                  </Button>
                  <Button
                    onClick={selectLot}
                    disabled={!selectedLotId || isLoading}
                    className="text-base px-6">
                    Selecionar Lote
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => updateDisputeStatus("waiting")}
              disabled={isLoading}
              size="lg"
              className="text-lg px-6">
              <Pause className="mr-2 h-5 w-5" />
              Pausar Disputa
            </Button>
          </>
        )}

        {status === "negotiation" && (
          <Button
            variant="destructive"
            onClick={() => updateDisputeStatus("closed")}
            disabled={isLoading}
            size="lg"
            className="text-lg px-6">
            <CheckCircle className="mr-2 h-5 w-5" />
            Encerrar Disputa
          </Button>
        )}

        {status === "closed" && (
          <Button
            variant="outline"
            onClick={() => updateDisputeStatus("waiting")}
            disabled={isLoading}
            size="lg"
            className="text-lg px-6">
            <Play className="mr-2 h-5 w-5" />
            Nova Disputa
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        size="lg"
        className="text-lg px-6">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Voltar para Detalhes da Licitação
      </Button>
    </div>
  );
}
