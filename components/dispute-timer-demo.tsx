"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, RotateCcw, Square, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeTimerDemoProps {
  lotId: string;
  mode: string;
  isActive: boolean;
  onTimeEnd: (lotId: string) => void;
  onExtension?: (lotId: string) => void;
  onFinalize?: (lotId: string) => void;
  isAuctioneer: boolean;
  lotStatus: string;
  onDisputeFinalized?: (lotId: string) => void; // Nova prop
}

export function DisputeTimerDemo({
  lotId,
  mode,
  isActive,
  onTimeEnd,
  onExtension,
  onFinalize,
  isAuctioneer,
  lotStatus,
  onDisputeFinalized, // Nova prop
}: DisputeTimerDemoProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [phase, setPhase] = useState<string>("initial");
  const [isRunning, setIsRunning] = useState(false);
  const [canRestart, setCanRestart] = useState(false);
  const { toast } = useToast();

  // Configurações de tempo por modo
  const getInitialTime = (disputeMode: string) => {
    switch (disputeMode) {
      case "open":
      case "open_restart":
        return 10 * 60; // 10 minutos
      case "open_closed":
        return 15 * 60; // 15 minutos para fase aberta
      case "closed_open":
        return 5 * 60; // 5 minutos para classificação
      case "random":
        return Math.floor(Math.random() * 30 * 60); // 0 a 30 minutos aleatório
      default:
        return 10 * 60;
    }
  };

  // Inicializar timer quando modo ou ativação mudar
  useEffect(() => {
    if (isActive && lotStatus === "open") {
      const initialTime = getInitialTime(mode);
      setTimeLeft(initialTime);
      setPhase("initial");
      setIsRunning(true);
      setCanRestart(false);
    } else {
      setIsRunning(false);
    }
  }, [mode, isActive, lotStatus]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0 && lotStatus === "open") {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1;

          // Lógica específica para modo aberto - prorrogação automática
          if (
            (mode === "open" || mode === "open_restart") &&
            newTime === 0 &&
            phase === "initial"
          ) {
            toast({
              title: `Tempo Inicial Encerrado - Lote ${lotId}`,
              description: "Iniciando período de prorrogação automática (2 min).",
            });
            setPhase("extension");
            return 2 * 60; // 2 minutos de extensão
          }

          // Fim do tempo
          if (newTime === 0) {
            setIsRunning(false);
            if (mode === "open_restart" && phase === "initial") {
              setCanRestart(true);
            }
            onTimeEnd(lotId);
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, phase, onTimeEnd, lotId, toast, lotStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "initial":
        return mode === "open_closed" ? "Fase Aberta" : "Tempo Inicial";
      case "extension":
        return "Prorrogação";
      case "closed_phase":
        return "Fase Fechada";
      case "random":
        return "Tempo Randômico";
      default:
        return "Disputa";
    }
  };

  const getTimerColor = () => {
    if (!isRunning || lotStatus !== "open") return "bg-gray-500";
    if (timeLeft <= 60) return "bg-red-500"; // Último minuto
    if (timeLeft <= 120) return "bg-orange-500"; // Últimos 2 minutos
    return "bg-green-500";
  };

  const handleRestart = () => {
    if (mode === "open_restart" && canRestart && isAuctioneer) {
      setTimeLeft(10 * 60); // Mais 10 minutos
      setIsRunning(true);
      setCanRestart(false);
      setPhase("restart");
      toast({
        title: "Disputa Reiniciada",
        description: `Pregoeiro reiniciou a disputa do lote ${lotId} por mais 10 minutos.`,
      });
      onExtension?.(lotId);
    }
  };

  const handleFinalize = () => {
    console.log(
      "🔎 [handleFinalize] lotId:",
      lotId,
      "lotStatus:",
      lotStatus,
      "isAuctioneer:",
      isAuctioneer
    );

    if (isAuctioneer && lotStatus === "open") {
      setIsRunning(false);
      setTimeLeft(0);

      // Simular definição do arrematante (menor valor)
      const mockSuppliers = {
        "lot-001": [
          { id: "s1", name: "FORNECEDOR 15", company: "Tech Solutions LTDA", value: 2890.0 },
          { id: "s2", name: "FORNECEDOR 22", company: "Inovação Digital ME", value: 2900.0 },
          { id: "s3", name: "FORNECEDOR 8", company: "Sistemas Avançados S.A.", value: 2904.0 },
        ],
        "lot-002": [
          { id: "s5", name: "FORNECEDOR 5", company: "Fornecedora Premium LTDA", value: 110.0 },
          { id: "s6", name: "FORNECEDOR 18", company: "Distribuidora Central ME", value: 115.0 },
        ],
        "lot-003": [
          { id: "s7", name: "FORNECEDOR 1", company: "Comercial Norte S.A.", value: 48.0 },
          { id: "s8", name: "FORNECEDOR 7", company: "Suprimentos Sul LTDA", value: 49.5 },
        ],
      };

      const suppliers = mockSuppliers[lotId as keyof typeof mockSuppliers] || [];
      if (suppliers.length > 0) {
        const winner = suppliers.reduce((prev, current) =>
          prev.value < current.value ? prev : current
        );

        toast({
          title: "Disputa Finalizada",
          description: `Disputa do lote ${lotId} finalizada. Arrematante: ${winner.name} com R$ ${winner.value.toFixed(2)}`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Disputa Finalizada",
          description: `Pregoeiro finalizou a disputa do lote ${lotId}.`,
        });
      }

      // Chamar as funções de callback
      onFinalize?.(lotId);
      onDisputeFinalized?.(lotId); // Nova chamada para mostrar controles do pregoeiro
    }
  };

  const simulateExtension = () => {
    if ((mode === "open" || mode === "open_restart") && phase === "extension" && isAuctioneer) {
      setTimeLeft(2 * 60); // Reset para 2 minutos
      toast({
        title: "Prorrogação Simulada",
        description: `Simulando lance nos últimos 2 minutos do lote ${lotId} - nova prorrogação!`,
      });
    }
  };

  // Status do lote
  if (lotStatus === "finished") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-600 text-white flex items-center gap-2 px-3 py-1">
          <Trophy className="h-4 w-4" />
          <span className="font-mono">Finalizado</span>
        </Badge>
        <Badge variant="outline">Disputa Encerrada</Badge>
      </div>
    );
  }

  if (lotStatus === "waiting" || !isActive) {
    return (
      <Badge variant="outline" className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Aguardando Início
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${getTimerColor()} text-white flex items-center gap-2 px-3 py-1`}>
        <Clock className="h-4 w-4" />
        <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
      </Badge>

      <Badge variant="outline">{getPhaseLabel()}</Badge>

      {mode === "random" && (
        <Badge variant="secondary" className="text-xs">
          Tempo Oculto
        </Badge>
      )}

      {isAuctioneer && lotStatus === "open" && (
        <div className="flex items-center gap-2">
          {canRestart && (
            <Button size="sm" onClick={handleRestart} className="h-8">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reiniciar
            </Button>
          )}

          {(mode === "open" || mode === "open_restart") && phase === "extension" && (
            <Button size="sm" variant="outline" onClick={simulateExtension} className="h-8">
              <Play className="h-4 w-4 mr-1" />
              Simular Lance
            </Button>
          )}

          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleFinalize} 
            className="h-8"
            title="Finalizar disputa e liberar controles do pregoeiro"
          >
            <Square className="h-4 w-4 mr-1" />
            Finalizar
          </Button>
        </div>
      )}
    </div>
  );
}