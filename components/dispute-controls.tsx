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
import { Play, Pause, MessageSquare, CheckCircle, Settings } from "lucide-react";

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
  const [disputeMode, setDisputeMode] = useState<string>("open_closed"); // Default to Aberto-Fechado
  const [disputeTime, setDisputeTime] = useState<number>(15); // Initial time for open phase

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

      // Enviar mensagem no sistema
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
      // Atualizar disputa principal
      const { error: disputeError } = await supabase
        .from("tender_disputes")
        .update({
          status: "open",
          active_lot_id: selectedLotId,
          dispute_mode: disputeMode,
        })
        .eq("tender_id", tenderId);

      if (disputeError) throw disputeError;

      // Criar/atualizar status do lote
      const { error: lotError } = await supabase.from("tender_lot_disputes").upsert({
        tender_id: tenderId,
        lot_id: selectedLotId,
        status: "open",
        dispute_mode: disputeMode,
        time_limit: disputeTime,
        // For random mode, set a random end time
        random_end_time:
          disputeMode === "random"
            ? new Date(Date.now() + Math.random() * 30 * 60 * 1000).toISOString()
            : null,
      });

      if (lotError) throw lotError;

      const selectedLotData = lots.find((lot) => lot.id === selectedLotId);

      // Enviar mensagem no sistema
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

      // Enviar mensagem no sistema
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
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-wrap gap-2">
        {status === "waiting" && (
          <Dialog open={openLotDialog} onOpenChange={setOpenLotDialog}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                Iniciar Disputa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Iniciar Disputa</DialogTitle>
                <DialogDescription>
                  Configure os parâmetros da disputa antes de iniciar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lot-select">Selecionar Lote</Label>
                  <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                    <SelectTrigger>
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
                  <Label htmlFor="dispute-mode">Modo de Disputa</Label>
                  <Select value={disputeMode} onValueChange={setDisputeMode}>
                    <SelectTrigger>
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

                {disputeMode !== "random" && ( // Only show time for non-random modes
                  <div>
                    <Label htmlFor="dispute-time">Tempo Inicial (minutos)</Label>
                    <Input
                      id="dispute-time"
                      type="number"
                      min="1"
                      max="60"
                      value={disputeTime}
                      onChange={(e) => setDisputeTime(Number.parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenLotDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={startDispute} disabled={!selectedLotId || isLoading}>
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
              disabled={isLoading}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Iniciar Negociação
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                  <Settings className="mr-2 h-4 w-4" />
                  Trocar Lote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selecionar Novo Lote</DialogTitle>
                  <DialogDescription>
                    Escolha outro lote para continuar a disputa.
                  </DialogDescription>
                </DialogHeader>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger>
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
                  <Button variant="outline" onClick={() => setOpenLotDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={selectLot} disabled={!selectedLotId || isLoading}>
                    Selecionar Lote
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => updateDisputeStatus("waiting")}
              disabled={isLoading}>
              <Pause className="mr-2 h-4 w-4" />
              Pausar Disputa
            </Button>
          </>
        )}

        {status === "negotiation" && (
          <Button
            variant="destructive"
            onClick={() => updateDisputeStatus("closed")}
            disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Encerrar Disputa
          </Button>
        )}

        {status === "closed" && (
          <Button
            variant="outline"
            onClick={() => updateDisputeStatus("waiting")}
            disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            Nova Disputa
          </Button>
        )}
      </div>
    </div>
  );
}
