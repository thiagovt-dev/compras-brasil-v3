"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeModeSelectorDemoProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  isAuctioneer: boolean;
}

const disputeModes = [
  {
    value: "open",
    label: "Aberto",
    description: "10 min iniciais + prorrogações automáticas de 2 min",
    color: "bg-green-500",
  },
  {
    value: "open_restart",
    label: "Aberto (com reinício)",
    description: "Modo aberto + possibilidade de reinício manual",
    color: "bg-blue-500",
  },
  {
    value: "closed",
    label: "Fechado",
    description: "Sem fase de lances, classificação direta",
    color: "bg-gray-500",
  },
  {
    value: "open_closed",
    label: "Aberto e Fechado",
    description: "Fase aberta + propostas finais fechadas",
    color: "bg-purple-500",
  },
  {
    value: "closed_open",
    label: "Fechado e Aberto",
    description: "Propostas fechadas + disputa aberta com top 3",
    color: "bg-orange-500",
  },
  {
    value: "random",
    label: "Randômico",
    description: "Tempo aleatório de 0 a 30 minutos (oculto)",
    color: "bg-red-500",
  },
];

export function DisputeModeSelectorDemo({
  currentMode,
  onModeChange,
  isAuctioneer,
}: DisputeModeSelectorDemoProps) {
  const [showSelector, setShowSelector] = useState(false);
  const { toast } = useToast();

  const currentModeData = disputeModes.find((mode) => mode.value === currentMode);

  const handleModeChange = (newMode: string) => {
    console.log("Changing mode from", currentMode, "to", newMode);
    onModeChange(newMode);
    setShowSelector(false);
    toast({
      title: "Modo de Disputa Alterado",
      description: `Modo alterado para: ${disputeModes.find((m) => m.value === newMode)?.label}`,
    });
  };

  if (!isAuctioneer) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentModeData?.color}`} />
          {currentModeData?.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${currentModeData?.color}`} />
        {currentModeData?.label}
      </Badge>

      {!showSelector ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
          onClick={() => {
            console.log("Alterar Modo button clicked");
            setShowSelector(true);
          }}>
          <Settings className="h-4 w-4 mr-1" />
          Alterar Modo
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={currentMode} onValueChange={handleModeChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {disputeModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${mode.color}`} />
                    {mode.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowSelector(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
