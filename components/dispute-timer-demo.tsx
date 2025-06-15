"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeTimerDemoProps {
  mode: string;
  isActive: boolean;
  onTimeEnd: () => void;
  onExtension?: () => void;
  isAuctioneer: boolean;
}

export function DisputeTimerDemo({
  mode,
  isActive,
  onTimeEnd,
  onExtension,
  isAuctioneer,
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
    if (isActive) {
      const initialTime = getInitialTime(mode);
      setTimeLeft(initialTime);
      setPhase("initial");
      setIsRunning(true);
      setCanRestart(false);
    } else {
      setIsRunning(false);
    }
  }, [mode, isActive]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
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
              title: "Tempo Inicial Encerrado",
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
            onTimeEnd();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, phase, onTimeEnd, toast]);

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
    if (!isRunning) return "bg-gray-500";
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
        description: "Pregoeiro reiniciou a disputa por mais 10 minutos.",
      });
      onExtension?.();
    }
  };

  const simulateExtension = () => {
    if ((mode === "open" || mode === "open_restart") && phase === "extension" && isAuctioneer) {
      setTimeLeft(2 * 60); // Reset para 2 minutos
      toast({
        title: "Prorrogação Simulada",
        description: "Simulando lance nos últimos 2 minutos - nova prorrogação!",
      });
    }
  };

  if (!isActive) {
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

      {isAuctioneer && (
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
        </div>
      )}
    </div>
  );
}
